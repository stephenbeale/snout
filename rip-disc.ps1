param(
    [Parameter(Mandatory=$true)]
    [string]$title,

    [Parameter()]
    [switch]$Series,

    [Parameter()]
    [int]$Disc = 1,

    [Parameter()]
    [string]$Drive = "D:",

    [Parameter()]
    [int]$DriveIndex = -1
)

# ========== HELPER FUNCTIONS ==========
function Get-UniqueFilePath {
    param([string]$DestDir, [string]$FileName)
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
    $extension = [System.IO.Path]::GetExtension($FileName)
    $targetPath = Join-Path $DestDir $FileName

    if (!(Test-Path $targetPath)) {
        return $targetPath
    }

    $counter = 1
    do {
        $newName = "$baseName-$counter$extension"
        $targetPath = Join-Path $DestDir $newName
        $counter++
    } while (Test-Path $targetPath)

    return $targetPath
}


# ========== DRIVE CONFIRMATION ==========
# Show which drive will be used and confirm before proceeding
$driveDescription = if ($DriveIndex -ge 0) {
    $hint = switch ($DriveIndex) {
        0 { "D: internal" }
        1 { "G: ASUS external" }
        default { "unknown drive" }
    }
    "Drive Index $DriveIndex ($hint)"
} else {
    "Drive $driveLetter"
}
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Ready to rip: $title" -ForegroundColor White
Write-Host "Using: $driveDescription" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
$response = Read-Host "Press Enter to continue, or Ctrl+C to abort"

# ========== CONFIGURATION ==========
# Normalize drive letter format (ensure it ends with colon)
$driveLetter = if ($Drive -match ':$') { $Drive } else { "${Drive}:" }
$makemkvOutputDir = "C:\Video\$title"  # MakeMKV rips here first
$finalOutputDir = if ($Series) { "E:\Series\$title" } else { "E:\DVDs\$title" }
$makemkvconPath = "C:\Program Files (x86)\MakeMKV\makemkvcon64.exe"
$handbrakePath = "C:\ProgramData\chocolatey\bin\HandBrakeCLI.exe"

# Track progress for error reporting
$lastSuccessfulStep = "None"

function Stop-WithError {
    param([string]$Step, [string]$Message)
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error at: $Step" -ForegroundColor Red
    Write-Host "Message: $Message" -ForegroundColor Red
    Write-Host "Last successful step: $lastSuccessfulStep" -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Red
    exit 1
}

$contentType = if ($Series) { "TV Series" } else { "Movie" }
$isMainFeatureDisc = (-not $Series) -and ($Disc -eq 1)
$extrasDir = Join-Path $finalOutputDir "extras"

# For disc 2+, ensure parent dir and extras folder exist upfront (disc 1 may still be running)
if (-not $isMainFeatureDisc -and -not $Series) {
    if (!(Test-Path $finalOutputDir)) {
        New-Item -ItemType Directory -Path $finalOutputDir -Force | Out-Null
    }
    if (!(Test-Path $extrasDir)) {
        New-Item -ItemType Directory -Path $extrasDir -Force | Out-Null
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DVD/Blu-ray Ripping & Encoding Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Title: $title" -ForegroundColor White
Write-Host "Type: $contentType" -ForegroundColor White
if ($DriveIndex -ge 0) {
    $driveHint = switch ($DriveIndex) {
        0 { "D: internal" }
        1 { "G: ASUS external" }
        default { "unknown" }
    }
    Write-Host "Drive Index: $DriveIndex ($driveHint)" -ForegroundColor White
} else {
    Write-Host "Drive: $driveLetter" -ForegroundColor White
}
if (-not $Series) { Write-Host "Disc: $Disc$(if ($Disc -gt 1) { ' (Special Features)' })" -ForegroundColor White }
Write-Host "MakeMKV Output: $makemkvOutputDir" -ForegroundColor White
Write-Host "Final Output: $finalOutputDir" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

# ========== STEP 1: RIP WITH MAKEMKV ==========
Write-Host "[STEP 1/4] Starting MakeMKV rip..." -ForegroundColor Green

# Use disc: syntax with index if provided (completely bypasses drive enumeration)
# Otherwise fall back to dev: syntax which still enumerates drives
if ($DriveIndex -ge 0) {
    $discSource = "disc:$DriveIndex"
    Write-Host "Using drive index: $DriveIndex (bypasses drive enumeration)" -ForegroundColor Green
} else {
    $discSource = "dev:$driveLetter"
    Write-Host "Using drive: $driveLetter (may enumerate other drives)" -ForegroundColor Yellow
    Write-Host "Tip: Use -DriveIndex to bypass drive enumeration" -ForegroundColor Gray
}

Write-Host "Creating directory: $makemkvOutputDir" -ForegroundColor Yellow
if (Test-Path $makemkvOutputDir) {
    Write-Host "Directory exists - cleaning existing MKV files..." -ForegroundColor Yellow
    $existingMkvs = Get-ChildItem -Path $makemkvOutputDir -Filter "*.mkv" -ErrorAction SilentlyContinue
    if ($existingMkvs) {
        $existingMkvs | Remove-Item -Force
        Write-Host "Removed $($existingMkvs.Count) existing MKV file(s)" -ForegroundColor Yellow
    }
} else {
    New-Item -ItemType Directory -Path $makemkvOutputDir | Out-Null
    Write-Host "Directory created successfully" -ForegroundColor Green
}

Write-Host "`nExecuting MakeMKV command..." -ForegroundColor Yellow
Write-Host "Command: makemkvcon mkv $discSource all `"$makemkvOutputDir`" --minlength=120" -ForegroundColor Gray
& $makemkvconPath mkv $discSource all $makemkvOutputDir --minlength=120
$makemkvExitCode = $LASTEXITCODE

# Check if MakeMKV succeeded
if ($makemkvExitCode -ne 0) {
    Stop-WithError -Step "STEP 1/4: MakeMKV rip" -Message "MakeMKV exited with code $makemkvExitCode"
}

$rippedFiles = Get-ChildItem -Path $makemkvOutputDir -Filter "*.mkv" -ErrorAction SilentlyContinue
if ($null -eq $rippedFiles -or $rippedFiles.Count -eq 0) {
    Stop-WithError -Step "STEP 1/4: MakeMKV rip" -Message "No MKV files were created. Check if disc is readable."
}

Write-Host "`nMakeMKV rip complete!" -ForegroundColor Green
Write-Host "Files ripped: $($rippedFiles.Count)" -ForegroundColor White
foreach ($file in $rippedFiles) {
    Write-Host "  - $($file.Name) ($([math]::Round($file.Length/1GB, 2)) GB)" -ForegroundColor Gray
}
$lastSuccessfulStep = "STEP 1/4: MakeMKV rip"

# Eject disc
Write-Host "`nEjecting disc from drive $driveLetter..." -ForegroundColor Yellow
$driveEject = New-Object -comObject Shell.Application
$driveEject.Namespace(17).ParseName($driveLetter).InvokeVerb("Eject")
Write-Host "Disc ejected successfully" -ForegroundColor Green


# ========== STEP 2: ENCODE WITH HANDBRAKE ==========
Write-Host "`n[STEP 2/4] Starting HandBrake encoding..." -ForegroundColor Green
Write-Host "Creating directory: $finalOutputDir" -ForegroundColor Yellow
if (!(Test-Path $finalOutputDir)) {
    New-Item -ItemType Directory -Path $finalOutputDir | Out-Null
    Write-Host "Directory created successfully" -ForegroundColor Green
} else {
    Write-Host "Directory already exists" -ForegroundColor Yellow
}

$mkvFiles = Get-ChildItem -Path $makemkvOutputDir -Filter "*.mkv"
$fileCount = 0
foreach ($mkv in $mkvFiles) {
    $fileCount++
    $inputFile = $mkv.FullName
    $outputFile = Join-Path $finalOutputDir ($mkv.BaseName + ".mp4")

    Write-Host "`n--- Encoding file $fileCount of $($mkvFiles.Count) ---" -ForegroundColor Cyan
    Write-Host "Input:  $($mkv.Name)" -ForegroundColor White
    Write-Host "Output: $($mkv.BaseName).mp4" -ForegroundColor White
    Write-Host "Size:   $([math]::Round($mkv.Length/1GB, 2)) GB" -ForegroundColor White

    Write-Host "`nExecuting HandBrake..." -ForegroundColor Yellow
    & $handbrakePath -i $inputFile -o $outputFile `
        --preset "Fast 1080p30" `
        --all-audio `
        --all-subtitles `
        --subtitle-burned=none `
        --verbose=1
    $handbrakeExitCode = $LASTEXITCODE

    if ($handbrakeExitCode -ne 0) {
        Stop-WithError -Step "STEP 2/4: HandBrake encoding" -Message "HandBrake exited with code $handbrakeExitCode while encoding $($mkv.Name)"
    }

    if (Test-Path $outputFile) {
        $encodedSize = (Get-Item $outputFile).Length
        Write-Host "`nEncoding complete: $($mkv.Name)" -ForegroundColor Green
        Write-Host "Output size: $([math]::Round($encodedSize/1GB, 2)) GB" -ForegroundColor White
    } else {
        Stop-WithError -Step "STEP 2/4: HandBrake encoding" -Message "Output file not created for $($mkv.Name)"
    }
}
$lastSuccessfulStep = "STEP 2/4: HandBrake encoding"

# Delete MakeMKV temporary directory after successful encode
Write-Host "`nChecking for successful encodes..." -ForegroundColor Yellow
$encodedFiles = Get-ChildItem -Path $finalOutputDir -Filter "*.mp4"
if ($encodedFiles.Count -gt 0) {
    Write-Host "Found $($encodedFiles.Count) encoded file(s)" -ForegroundColor Green
    Write-Host "Removing temporary MakeMKV directory: $makemkvOutputDir" -ForegroundColor Yellow
    Remove-Item -Path $makemkvOutputDir -Recurse -Force
    Write-Host "Temporary files removed successfully" -ForegroundColor Green
} else {
    Write-Host "WARNING: No encoded files found. Keeping MakeMKV directory." -ForegroundColor Red
}

# ========== STEP 3: RENAME AND ORGANIZE ==========
Write-Host "`n[STEP 3/4] Organizing files..." -ForegroundColor Green
cd $finalOutputDir

Write-Host "Current directory: $finalOutputDir" -ForegroundColor Yellow

# prefix files with parent dir name (only if not already prefixed)
Write-Host "`nPrefixing files with directory name..." -ForegroundColor Yellow
$filesToPrefix = Get-ChildItem -File | Where-Object { $_.Name -notlike ($_.Directory.Name + "-*") }
if ($filesToPrefix) {
    Write-Host "Files to prefix: $($filesToPrefix.Count)" -ForegroundColor White
    $filesToPrefix | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
    $filesToPrefix | Rename-Item -NewName { $_.Directory.Name + "-" + $_.Name }
    Write-Host "Prefixing complete" -ForegroundColor Green
} else {
    Write-Host "No files need prefixing" -ForegroundColor Gray
}

# Movie disc 1 only: add 'Feature' suffix to largest file
if ($isMainFeatureDisc) {
    Write-Host "`nChecking for Feature file..." -ForegroundColor Yellow
    $featureExists = Get-ChildItem -File | Where-Object { $_.Name -like "*-Feature.*" }
    if (!$featureExists) {
        $largestFile = Get-ChildItem -File | Sort-Object Length -Descending | Select-Object -First 1
        if ($largestFile) {
            Write-Host "Largest file: $($largestFile.Name) ($([math]::Round($largestFile.Length/1GB, 2)) GB)" -ForegroundColor White
            $newName = $largestFile.Directory.Name + "-Feature" + $largestFile.Extension
            Write-Host "Renaming to: $newName" -ForegroundColor Yellow
            Rename-Item -Path $largestFile.FullName -NewName $newName
            Write-Host "Feature file renamed successfully" -ForegroundColor Green
        }
    } else {
        Write-Host "Feature file already exists: $($featureExists.Name)" -ForegroundColor Gray
    }
} else {
    $skipReason = if ($Series) { "Series mode" } else { "Special Features disc" }
    Write-Host "`nSkipping Feature rename ($skipReason)" -ForegroundColor Gray
}

# delete image files (only if they exist)
Write-Host "`nDeleting image files..." -ForegroundColor Yellow
$imageFiles = Get-ChildItem -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|gif|bmp)$' }
if ($imageFiles) {
    Write-Host "Image files to delete: $($imageFiles.Count)" -ForegroundColor White
    $imageFiles | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
    $imageFiles | Remove-Item -ErrorAction SilentlyContinue
    Write-Host "Image files deleted" -ForegroundColor Green
} else {
    Write-Host "No image files found" -ForegroundColor Gray
}

# Handle extras folder based on disc type
if ($isMainFeatureDisc) {
    # Disc 1: move non-feature videos to extras
    Write-Host "`nChecking for non-feature videos..." -ForegroundColor Yellow
    $nonFeatureVideos = Get-ChildItem -File | Where-Object { $_.Extension -match '\.(mp4|avi|mkv|mov|wmv)$' -and $_.Name -notlike "*Feature*" }
    if ($nonFeatureVideos) {
        Write-Host "Non-feature videos found: $($nonFeatureVideos.Count)" -ForegroundColor White
        $nonFeatureVideos | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }

        if (!(Test-Path "extras")) {
            Write-Host "Creating extras directory..." -ForegroundColor Yellow
            md extras | Out-Null
            Write-Host "Extras directory created" -ForegroundColor Green
        } else {
            Write-Host "Extras directory already exists" -ForegroundColor Gray
        }

        Write-Host "Moving files to extras..." -ForegroundColor Yellow
        $nonFeatureVideos | Move-Item -Destination extras -ErrorAction SilentlyContinue
        Write-Host "Files moved to extras" -ForegroundColor Green
    } else {
        Write-Host "No non-feature videos found" -ForegroundColor Gray
    }
} elseif (-not $Series) {
    # Disc 2+: move videos to extras folder (exclude Feature file from disc 1)
    Write-Host "`nMoving special features to extras folder..." -ForegroundColor Yellow

    if (!(Test-Path $extrasDir)) {
        Write-Host "Creating extras directory..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $extrasDir | Out-Null
        Write-Host "Extras directory created" -ForegroundColor Green
    } else {
        Write-Host "Extras directory already exists" -ForegroundColor Gray
    }

    # Exclude Feature file (may have been created by disc 1)
    $videoFiles = Get-ChildItem -File | Where-Object { $_.Extension -match '\.(mp4|avi|mkv|mov|wmv)$' -and $_.Name -notlike "*-Feature.*" }
    if ($videoFiles) {
        Write-Host "Videos to move: $($videoFiles.Count)" -ForegroundColor White
        foreach ($video in $videoFiles) {
            $uniquePath = Get-UniqueFilePath -DestDir $extrasDir -FileName $video.Name
            $newName = [System.IO.Path]::GetFileName($uniquePath)
            if ($newName -ne $video.Name) {
                Write-Host "  - $($video.Name) -> $newName (renamed to avoid clash)" -ForegroundColor Yellow
            } else {
                Write-Host "  - $($video.Name)" -ForegroundColor Gray
            }
            Move-Item -Path $video.FullName -Destination $uniquePath
        }
        Write-Host "Files moved to extras" -ForegroundColor Green
    } else {
        Write-Host "No video files to move" -ForegroundColor Gray
    }
} else {
    Write-Host "`nSkipping extras folder (Series mode)" -ForegroundColor Gray
}
$lastSuccessfulStep = "STEP 3/4: File organization"

# ========== STEP 4: OPEN DIRECTORY ==========
Write-Host "`n[STEP 4/4] Opening film directory..." -ForegroundColor Green
Write-Host "Opening: $finalOutputDir" -ForegroundColor Yellow
start $finalOutputDir
$lastSuccessfulStep = "STEP 4/4: Open directory"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All steps completed successfully" -ForegroundColor Green
$discInfo = if (-not $Series -and $Disc -gt 1) { " (Disc $Disc)" } else { "" }
Write-Host "$contentType processed: $title$discInfo" -ForegroundColor White
Write-Host "Final location: $finalOutputDir" -ForegroundColor White
Write-Host "`nSummary:" -ForegroundColor Cyan
$finalFiles = Get-ChildItem -Path $finalOutputDir -File -Recurse
Write-Host "  Total files: $($finalFiles.Count)" -ForegroundColor White
Write-Host "  Total size: $([math]::Round(($finalFiles | Measure-Object -Property Length -Sum).Sum/1GB, 2)) GB" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan
