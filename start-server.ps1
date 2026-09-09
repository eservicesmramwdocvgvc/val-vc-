Add-Type -AssemblyName System.Web
Add-Type -AssemblyName System.Net.HttpListener

$listener = New-Object System.Net.HttpListener
$port = 8890
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server running at http://localhost:$port/" -ForegroundColor Green
Write-Host "For access from other devices on your local network, use your IP address instead of localhost."
Write-Host "For access from everywhere (the internet), use a tool like ngrok: 'ngrok http $port'"
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

$WebRoot = "c:\Users\LADY P\Downloads\MRA WEB\website"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $path = $request.Url.AbsolutePath
        $method = $request.HttpMethod
        Write-Host "[$method] $path" -ForegroundColor Cyan

        if ($path -eq "/") { $path = "/index.html" }
        $relativePath = $path.TrimStart('/').Replace('/', '\')
        $localPath = Join-Path $WebRoot $relativePath
        
        # Handle cases where path doesn't have .html but should
        if (!(Test-Path $localPath -PathType Leaf) -and (Test-Path "$localPath.html" -PathType Leaf)) {
            $localPath = "$localPath.html"
        }

        if (Test-Path $localPath -PathType Leaf) {
            try {
                $content = [System.IO.File]::ReadAllBytes($localPath)
                $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
                $mimeTypes = @{
                    ".html" = "text/html; charset=utf-8"
                    ".css" = "text/css; charset=utf-8"
                    ".js" = "application/javascript; charset=utf-8"
                    ".png" = "image/png"
                    ".jpg" = "image/jpeg"
                    ".jpeg" = "image/jpeg"
                    ".gif" = "image/gif"
                    ".svg" = "image/svg+xml"
                    ".json" = "application/json; charset=utf-8"
                    ".woff2" = "font/woff2"
                    ".woff" = "font/woff"
                    ".ttf" = "font/ttf"
                }
                $response.ContentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $response.ContentLength64 = $content.Length
                $response.OutputStream.Write($content, 0, $content.Length)
                $response.StatusCode = 200
                Write-Host "  200 OK" -ForegroundColor Green
            } catch {
                Write-Host "  500 Internal Server Error: $($_.Exception.Message)" -ForegroundColor Red
                $response.StatusCode = 500
                $response.ContentType = "text/plain; charset=utf-8"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes("Internal Server Error")
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        } else {
            Write-Host "  404 Not Found: $localPath" -ForegroundColor Red
            $response.StatusCode = 404
            $response.ContentType = "text/plain; charset=utf-8"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        
        try {
            $response.OutputStream.Flush()
        } catch {}
        
        $response.Close()
    }
} finally {
    if ($listener.IsListening) { $listener.Stop() }
    $listener.Close()
    Write-Host "Server stopped" -ForegroundColor Red
}
