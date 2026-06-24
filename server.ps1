$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')
$listener.Prefixes.Add('http://127.0.0.1:8080/')
$listener.Start()
Write-Host "Server started at http://localhost:8080/"
Write-Host "Press Ctrl+C to stop the server"
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $path = $request.Url.AbsolutePath
        if ($path -eq "/") { $path = "/index.html" }
        $localPath = "c:\Users\LADY P\Downloads\MRA WEB\website$path"
        if (Test-Path $localPath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($localPath)
            $ext = [System.IO.Path]::GetExtension($localPath)
            $mimeTypes = @{
                ".html" = "text/html"
                ".css" = "text/css"
                ".js" = "application/javascript"
                ".png" = "image/png"
                ".woff2" = "font/woff2"
            }
            $response.ContentType = $mimeTypes[$ext]
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
            $response.ContentType = "text/plain"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}