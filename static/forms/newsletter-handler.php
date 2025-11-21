<?php
// SIPEG newsletter handler: stores subscribers locally and forwards to Google + providers.
// Requirements:
// - Ensure /forms/data is writable by the web server user.
// - Populate the provider constants below before deploying.

const CSV_PATH = __DIR__ . '/data/newsletter-subscribers.csv';
const GOOGLE_WEBHOOK = 'https://script.google.com/macros/s/AKfycbzzfiDShCYcVNeErBl1HPN2gvB8uUHJMScHD8fX4KC7KnB8Q_R5kIVAzfjOMzIdLDG-/exec';
const MAILCHIMP_API_URL = ''; // e.g. https://usX.api.mailchimp.com/3.0/lists/{list_id}/members
const MAILCHIMP_API_KEY = ''; // e.g. apikey-usX
const SUBSTACK_WEBHOOK = ''; // e.g. https://yourpublication.substack.com/api/reader/subscriptions

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
    'timestamp' => gmdate('c'),
    'name'      => clean($_POST['name'] ?? ''),
    'email'     => filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL) ?: '',
    'ip'        => $_SERVER['REMOTE_ADDR'] ?? '',
];

if (!$data['email']) {
    http_response_code(422);
    exit('Invalid email');
}

$GLOBALS['newsletter_response_sent'] = false;

try {
    appendToCsv($data);
    sendImmediateSuccess();
    forwardToGoogle($data);
    forwardToMailchimp($data);
    forwardToSubstack($data);
} catch (Throwable $e) {
    error_log('[SIPEG newsletter] ' . $e->getMessage());
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
        'name'  => $row['name'],
        'email' => $row['email'],
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
        throw new RuntimeException('Google newsletter webhook error: ' . ($error ?: 'unknown'));
    }
    if ($code && $code >= 400) {
        throw new RuntimeException('Google webhook HTTP ' . $code . ': ' . $response);
    }
}

function forwardToMailchimp(array $row): void
{
    if (!MAILCHIMP_API_URL || !MAILCHIMP_API_KEY) {
        return;
    }
    $payload = json_encode([
        'email_address' => $row['email'],
        'status'        => 'subscribed',
        'merge_fields'  => [
            'FNAME' => $row['name'],
        ],
    ]);

    $ch = curl_init(MAILCHIMP_API_URL);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 6,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Basic ' . base64_encode('anystring:' . MAILCHIMP_API_KEY),
        ],
    ]);
    $response = curl_exec($ch);
    $error    = curl_error($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || ($code && $code >= 400)) {
        throw new RuntimeException('Mailchimp error: ' . ($error ?: $response ?: 'unknown'));
    }
}

function forwardToSubstack(array $row): void
{
    if (!SUBSTACK_WEBHOOK) {
        return;
    }
    $payload = json_encode([
        'email' => $row['email'],
        'name'  => $row['name'],
        'source'=> 'sipeg-hugo',
    ]);

    $ch = curl_init(SUBSTACK_WEBHOOK);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 6,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
        ],
    ]);
    $response = curl_exec($ch);
    $error    = curl_error($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || ($code && $code >= 400)) {
        throw new RuntimeException('Substack error: ' . ($error ?: $response ?: 'unknown'));
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
    $GLOBALS['newsletter_response_sent'] = true;
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } else {
        @ob_flush();
        @flush();
    }
}

function responseAlreadySent(): bool
{
    return !empty($GLOBALS['newsletter_response_sent']);
}

function clean(string $value): string
{
    return trim(filter_var($value, FILTER_SANITIZE_SPECIAL_CHARS));
}
