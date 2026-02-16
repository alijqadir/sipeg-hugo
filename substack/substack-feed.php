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

// Basic error handling
if (!filter_var($feed_url, FILTER_VALIDATE_URL)) {
    echo json_encode(['error' => 'Invalid feed URL']);
    exit;
}

// Fetch the RSS
$xml_string = @file_get_contents($feed_url);
if ($xml_string === false) {
    echo json_encode(['error' => 'Unable to fetch feed']);
    exit;
}

// Parse XML
$xml = @simplexml_load_string($xml_string);
if ($xml === false || !isset($xml->channel->item)) {
    echo json_encode(['error' => 'Invalid feed XML']);
    exit;
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

echo json_encode([
    'items' => $items
]);

