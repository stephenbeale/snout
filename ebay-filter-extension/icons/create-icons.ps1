Add-Type -AssemblyName System.Drawing

$sizes = @(16, 48, 128)
$color = [System.Drawing.Color]::FromArgb(6, 84, 186)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear($color)

    # Add a simple "P" for Price in white
    $font = New-Object System.Drawing.Font("Arial", [int]($size * 0.6), [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $g.DrawString([char]0x00A3, $font, $brush, $rect, $format)

    $g.Dispose()
    $bmp.Save("$PSScriptRoot\icon$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created icon$size.png"
}
