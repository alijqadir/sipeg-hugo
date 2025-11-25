<?php
// SIPEG event RSVP handler: logs to CSV, responds immediately, then forwards to Google Apps Script.
// Requirements:
// - Ensure /forms/data is writable by the web server user.
// - Deploy the Apps Script from static/event-invite-apps-script.md and paste the /exec URL below.

const CSV_PATH = __DIR__ . '/data/event-rsvps.csv';
const GOOGLE_WEBHOOK = 'https://script.google.com/macros/s/AKfycbzNT8VS7TL1CK9GI1NXCcHz-Mu_6Cl0YAotlIK0gxKdEehgqBh4aEI9kaYdnEGBKEt3/exec';

header('Content-Type: text/plain; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

$honeypot = trim($_POST['hp_field'] ?? '');
if ($honeypot !== '') {
    exit('OK');
}

$data = [
    'timestamp'        => gmdate('c'),
    'name'             => clean($_POST['name'] ?? ''),
    'email'            => filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL) ?: '',
    'event_title'      => clean($_POST['event_title'] ?? ''),
    'event_url'        => clean($_POST['event_url'] ?? ''),
    'event_start'      => clean($_POST['event_start'] ?? ''),
    'event_end'        => clean($_POST['event_end'] ?? ''),
    'event_location'   => clean($_POST['event_location'] ?? ''),
    'gcal_calendar_id' => clean($_POST['gcal_calendar_id'] ?? ''),
    'gcal_event_id'    => clean($_POST['gcal_event_id'] ?? ''),
    'event_join_link'  => clean($_POST['event_join_link'] ?? ''),
    'zoom_meeting_id'  => clean($_POST['zoom_meeting_id'] ?? ''),
    'ip'               => $_SERVER['REMOTE_ADDR'] ?? '',
];

if (!$data['name'] || !$data['email'] || !$data['event_title']) {
    http_response_code(422);
    exit('Missing required fields');
}

$GLOBALS['event_response_sent'] = false;

try {
    appendToCsv($data);
    sendImmediateSuccess();
    forwardToGoogle($data);
} catch (Throwable $e) {
    error_log('[SIPEG event RSVP] ' . $e->getMessage());
    if (!responseAlreadySent()) {
        http_response_code(500);
        echo 'Error';
    }
}

function appendToCsv(array $row): void
{
    $dir = dirname(CSV_PATH);
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new RuntimeException('Unable to create data directory');
        }
    }

    $isNew = !file_exists(CSV_PATH);
    $fp = fopen(CSV_PATH, 'ab');
    if ($fp === false) {
        throw new RuntimeException('Unable to open CSV for writing');
    }
    if ($isNew) {
        fputcsv($fp, array_keys($row));
    }
    fputcsv($fp, array_values($row));
    fclose($fp);
}

function forwardToGoogle(array $row): void
{
    if (!GOOGLE_WEBHOOK) {
        return;
    }

    $payload = http_build_query([
        'name'             => $row['name'],
        'email'            => $row['email'],
        'event_title'      => $row['event_title'],
        'event_url'        => $row['event_url'],
        'event_start'      => $row['event_start'],
        'event_end'        => $row['event_end'],
        'event_location'   => $row['event_location'],
        'gcal_calendar_id' => $row['gcal_calendar_id'],
        'gcal_event_id'    => $row['gcal_event_id'],
        'event_join_link'  => $row['event_join_link'],
        'zoom_meeting_id'  => $row['zoom_meeting_id'],
    ]);

    $ch = curl_init(GOOGLE_WEBHOOK);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
    ]);
    $response = curl_exec($ch);
    $error    = curl_error($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false) {
        throw new RuntimeException('Google event webhook error: ' . ($error ?: 'unknown'));
    }
    if ($code && $code >= 400) {
        throw new RuntimeException('Google event webhook HTTP ' . $code . ': ' . $response);
    }
}

function sendImmediateSuccess(): void
{
    static $sent = false;
    if ($sent) {
        return;
    }
    echo 'OK';
    $sent = true;
    $GLOBALS['event_response_sent'] = true;
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } else {
        @ob_flush();
        @flush();
    }
}

function responseAlreadySent(): bool
{
    return !empty($GLOBALS['event_response_sent']);
}

function clean(string $value): string
{
    return trim(filter_var($value, FILTER_SANITIZE_SPECIAL_CHARS));
}
