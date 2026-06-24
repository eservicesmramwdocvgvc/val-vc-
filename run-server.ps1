Add-Type -AssemblyName System.Web
$listener = New-Object System.Net.HttpListener
$port = 8889
$listener.Prefixes.Add("http://localhost:$port/")
# To allow access from other devices on the network, you might need to run as Admin and use:
# $listener.Prefixes.Add("http://*:$port/") 

$listener.Start()
Write-Host "Server running at http://localhost:$port/"
Write-Host "For access from other devices on your local network, use your IP address instead of localhost."
Write-Host "For access from everywhere (the internet), use a tool like ngrok: 'ngrok http $port'"
Write-Host "Press Ctrl+C to stop"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $path = $request.Url.AbsolutePath
        $method = $request.HttpMethod
        Write-Host "[$method] $path"

        if ($path -eq "/") { $path = "/index.html" }
        $relativePath = $path.TrimStart('/').Replace('/', '\')
        $localPath = Join-Path "c:\Users\LADY P\Downloads\MRA WEB\website" $relativePath
        
        # Handle cases where path doesn't have .html but should
        if (!(Test-Path $localPath -PathType Leaf) -and (Test-Path "$localPath.html" -PathType Leaf)) {
            $localPath = "$localPath.html"
        }

        if (Test-Path $localPath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($localPath)
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $mimeTypes = @{
                ".html" = "text/html"
                ".css" = "text/css"
                ".js" = "application/javascript"
                ".png" = "image/png"
                ".jpg" = "image/jpeg"
                ".jpeg" = "image/jpeg"
                ".gif" = "image/gif"
                ".svg" = "image/svg+xml"
                ".json" = "application/json"
                ".woff2" = "font/woff2"
                ".woff" = "font/woff"
                ".ttf" = "font/ttf"
            }
            $response.ContentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            Write-Host "  404 Not Found: $localPath"
            $response.StatusCode = 404
            $response.ContentType = "text/plain"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        $response.Close()
    }
} finally {
    if ($listener.IsListening) { $listener.Stop() }
    $listener.Close()
}