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
$feed_url = 'https://alijanqadir.substack.com/feed';

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

    // Strip tags, make a short excerpt
    $plain = trim(preg_replace('/\s+/', ' ', strip_tags($desc)));
    $excerpt = mb_substr($plain, 0, 180);
    if (mb_strlen($plain) > 180) {
        $excerpt .= '…';
    }

    // Try to extract first image from description HTML
    $img_src = '';
    if (!empty($desc)) {
        if (preg_match('/<img[^>]+src="([^"]+)"/i', $desc, $m)) {
            $img_src = $m[1];
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

