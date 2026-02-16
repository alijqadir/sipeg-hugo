<?php
// SIPEG contact form handler: writes to CSV, then forwards to Google Apps Script.
// Requirements:
// 1. Ensure the /forms/data directory is writable by the web server user.
// 2. Update GOOGLE_WEBHOOK to your deployed Apps Script /exec URL.

const CSV_PATH = __DIR__ . '/data/contact-submissions.csv';
const GOOGLE_WEBHOOK = 'https://script.google.com/macros/s/AKfycbwBNarGaItGWiJr9X18ppSfqZJYudsEVGFJU2PypmQ7Slfz63ms2HbkdND1Gtf6cjUNHw/exec';

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
    'timestamp'    => gmdate('c'),
    'name'         => clean($_POST['name'] ?? ''),
    'email'        => clean($_POST['email'] ?? ''),
    'phone'        => clean($_POST['phone'] ?? ''),
    'organization' => clean($_POST['organization'] ?? ''),
    'message'      => normalizeMessage($_POST['message'] ?? ''),
    'ip'           => $_SERVER['REMOTE_ADDR'] ?? '',
];

$GLOBALS['sipeg_response_sent'] = false;

try {
    appendToCsv($data);
    sendImmediateSuccess();
    forwardToGoogle($data);
} catch (Throwable $e) {
    error_log('[SIPEG contact] ' . $e->getMessage());
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
        'name'         => $row['name'],
        'email'        => $row['email'],
        'phone'        => $row['phone'],
        'organization' => $row['organization'],
        'message'      => $row['message'],
    ]);

    $ch = curl_init(GOOGLE_WEBHOOK);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 6,
    ]);
    $response = curl_exec($ch);
    $error    = curl_error($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false) {
        throw new RuntimeException('Google webhook error: ' . ($error ?: 'unknown'));
    }
    if ($code && $code >= 400) {
        throw new RuntimeException('Google webhook HTTP ' . $code . ': ' . $response);
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
    $GLOBALS['sipeg_response_sent'] = true;
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } else {
        @ob_flush();
        @flush();
    }
}

function responseAlreadySent(): bool
{
    return !empty($GLOBALS['sipeg_response_sent']);
}

function clean(string $value): string
{
    return trim(filter_var($value, FILTER_SANITIZE_SPECIAL_CHARS));
}

function normalizeMessage(string $value): string
{
    $value = trim(str_replace(["\r\n", "\r"], "\n", $value));
    return preg_replace('/\s+/', ' ', $value);
}
