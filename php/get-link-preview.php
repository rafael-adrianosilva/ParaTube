<?php
header('Content-Type: application/json');

$url = $_GET['url'] ?? null;

if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
    echo json_encode(['success' => false]);
    exit;
}

try {
    // Fetch URL content
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; ParaTube/1.0)');
    $html = curl_exec($ch);
    curl_close($ch);
    
    if (!$html) {
        throw new Exception('Failed to fetch URL');
    }
    
    // Parse Open Graph tags
    $preview = [
        'title' => null,
        'description' => null,
        'image' => null,
        'domain' => parse_url($url, PHP_URL_HOST)
    ];
    
    // Extract OG title
    if (preg_match('/<meta\s+property=["\']og:title["\']\s+content=["\'](.*?)["\']/i', $html, $matches)) {
        $preview['title'] = $matches[1];
    }
    
    // Extract OG description
    if (preg_match('/<meta\s+property=["\']og:description["\']\s+content=["\'](.*?)["\']/i', $html, $matches)) {
        $preview['description'] = substr($matches[1], 0, 200);
    }
    
    // Extract OG image
    if (preg_match('/<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']/i', $html, $matches)) {
        $preview['image'] = $matches[1];
    }
    
    // Fallback to title tag
    if (!$preview['title'] && preg_match('/<title>(.*?)<\/title>/i', $html, $matches)) {
        $preview['title'] = $matches[1];
    }
    
    // Fallback to meta description
    if (!$preview['description'] && preg_match('/<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']/i', $html, $matches)) {
        $preview['description'] = substr($matches[1], 0, 200);
    }
    
    echo json_encode([
        'success' => true,
        'preview' => $preview
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
