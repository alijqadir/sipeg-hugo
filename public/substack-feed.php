<?php
// substack-feed.php – lightweight Substack → JSON bridge

// ✅ Allow requests from your Hugo dev server (localhost:1313)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Optional: show PHP errors while debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CONFIG: your Substack feed URL
$feed_url = 'https://sipeg.substack.com/feed';

function send_json($payload) {
    echo json_encode($payload);
    exit;
}

if (!filter_var($feed_url, FILTER_VALIDATE_URL)) {
    send_json(['error' => 'Invalid feed URL']);
}

// Try cURL first (Substack sometimes blocks empty UA)
function fetch_feed($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_USERAGENT => 'SIPEG-Feed/1.0 (+https://sipeg.org)'
        ]);
        $data = curl_exec($ch);
        $err  = curl_error($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($data !== false && $code >= 200 && $code < 300) {
            return $data;
        }
    }

    // Fallback to file_get_contents with a UA/context
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 10,
            'header' => "User-Agent: SIPEG-Feed/1.0 (+https://sipeg.org)\r\n"
        ]
    ]);

    return @file_get_contents($url, false, $context);
}

$xml_string = fetch_feed($feed_url);
if ($xml_string === false) {
    send_json(['error' => 'Unable to fetch feed']);
}

$xml = @simplexml_load_string($xml_string);
if ($xml === false || !isset($xml->channel->item)) {
    send_json(['error' => 'Invalid feed XML']);
}

$items = [];
$max_items = 6; // how many to return
$count = 0;

foreach ($xml->channel->item as $item) {
    if ($count >= $max_items) break;
    $count++;

    $title = (string) $item->title;
    $link  = (string) $item->link;
    $date  = (string) $item->pubDate;
    $desc  = (string) $item->description;

    // Some Substack feeds store full HTML in content:encoded (including images)
    $contentNS = $item->children('http://purl.org/rss/1.0/modules/content/');
    $contentEncoded = isset($contentNS->encoded) ? (string) $contentNS->encoded : '';

    // Strip tags, make a short excerpt
    $htmlForExcerpt = $desc ?: $contentEncoded;
    $plain = trim(preg_replace('/\s+/', ' ', strip_tags($htmlForExcerpt)));
    $excerpt = mb_substr($plain, 0, 180);
    if (mb_strlen($plain) > 180) {
        $excerpt .= '…';
    }

    // Try to extract first image from description HTML
    $img_src = '';
    $htmlForImage = $contentEncoded ?: $desc;
    if (!empty($htmlForImage) && preg_match('/<img[^>]+src="([^"]+)"/i', $htmlForImage, $m)) {
        $img_src = $m[1];
    } else {
        // Fallback to media:content if present
        $media = $item->children('http://search.yahoo.com/mrss/');
        if (isset($media->content)) {
            $attrs = $media->content->attributes();
            if (isset($attrs['url'])) {
                $img_src = (string) $attrs['url'];
            }
        }
    }

    $items[] = [
        'title'   => $title,
        'link'    => $link,
        'date'    => $date,
        'excerpt' => $excerpt,
        'image'   => $img_src,
    ];
}

send_json(['items' => $items]);
