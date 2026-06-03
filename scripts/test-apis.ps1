# TZW API smoke + role tests — run with gateway on :3001
$Base = "http://localhost:3001"
$Results = [System.Collections.Generic.List[object]]::new()

function Record($Method, $Path, $Role, $Status, $Note) {
  $script:Results.Add([pscustomobject]@{
      Method = $Method
      Path   = $Path
      Role   = $Role
      Status = $Status
      Note   = $Note
    })
}

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    [string]$Role = "public",
    [hashtable]$Headers = @{},
    $Body = $null,
    [int[]]$Expect = @(200)
  )
  $uri = "$Base$Path"
  try {
    $params = @{
      Method      = $Method
      Uri         = $uri
      Headers     = $Headers
      TimeoutSec  = 15
      ErrorAction = "Stop"
    }
    if ($null -ne $Body) {
      $params.ContentType = "application/json"
      $params.Body = ($Body | ConvertTo-Json -Depth 6 -Compress)
    }
    $r = Invoke-WebRequest @params
    $ok = $Expect -contains $r.StatusCode
    Record $Method $Path $Role $r.StatusCode $(if ($ok) { "OK" } else { "Unexpected status" })
    return @{ ok = $ok; status = $r.StatusCode; content = $r.Content }
  }
  catch {
    $status = 0
    $msg = $_.Exception.Message
    if ($_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
      try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $msg = $reader.ReadToEnd()
        $reader.Close()
      }
      catch { }
    }
    $ok = $Expect -contains $status
    Record $Method $Path $Role $status $(if ($ok) { "Expected error" } else { $msg.Substring(0, [Math]::Min(120, $msg.Length)) })
    return @{ ok = $ok; status = $status; content = $msg }
  }
}

Write-Host "Testing TZW API at $Base"

# Public
Invoke-Api GET "/" "public" | Out-Null
Invoke-Api POST "/auth/login" "public" @{
  email      = "admin@example.com"
  password   = "password123"
  rememberMe = $true
} -Expect @(200, 401, 403) | Out-Null

$adminLogin = Invoke-Api POST "/auth/login" "public" @{
  email      = "admin@example.com"
  password   = "password123"
  rememberMe = $true
}
$adminToken = $null
if ($adminLogin.content) {
  $adminJson = $adminLogin.content | ConvertFrom-Json
  $adminToken = $adminJson.accessToken
}

$userLogin = Invoke-Api POST "/auth/login" "public" @{
  email      = "samuellamugisha207@gmail.com"
  password   = "1234qwerty"
  rememberMe = $true
}
$userToken = $null
if ($userLogin.content) {
  try {
    $userJson = $userLogin.content | ConvertFrom-Json
    $userToken = $userJson.accessToken
  }
  catch { }
}
if (-not $userToken) {
  $userLogin = Invoke-Api POST "/auth/login" "public" @{
    email      = "user@tzw.local"
    password   = "password123"
    rememberMe = $true
  }
  if ($userLogin.content) {
    $userToken = ($userLogin.content | ConvertFrom-Json).accessToken
  }
}

$inspLogin = Invoke-Api POST "/auth/login" "public" @{
  email      = "samuellamugisha964@gmail.com"
  password   = "1234qwerty"
  rememberMe = $true
}
$inspToken = $null
if ($inspLogin.content) {
  try {
    $inspToken = ($inspLogin.content | ConvertFrom-Json).accessToken
  }
  catch { }
}
if (-not $inspToken) {
  $inspLogin = Invoke-Api POST "/auth/login" "public" @{
    email      = "inspector@tzw.local"
    password   = "password123"
    rememberMe = $true
  }
  if ($inspLogin.content) {
    $inspToken = ($inspLogin.content | ConvertFrom-Json).accessToken
  }
}

function Auth($token) {
  if (-not $token) { return @{ Authorization = "Bearer invalid" } }
  return @{ Authorization = "Bearer $token" }
}

if ($adminToken) {
  $h = Auth $adminToken
  Invoke-Api GET "/users/me" "admin" $h | Out-Null
  Invoke-Api GET "/users" "admin" $h | Out-Null
  Invoke-Api GET "/extinguishers" "admin" $h | Out-Null
  Invoke-Api GET "/inspections" "admin" $h | Out-Null
  Invoke-Api GET "/reports/overview" "admin" $h | Out-Null
  Invoke-Api GET "/reports/compliance" "admin" $h | Out-Null
  Invoke-Api GET "/reports/inventory" "admin" $h | Out-Null
  Invoke-Api GET "/reports/inspections" "admin" $h | Out-Null
  Invoke-Api GET "/reports/maintenance" "admin" $h | Out-Null
  Invoke-Api POST "/users/admin/run-expiry-check" "admin" $h -Body @{} | Out-Null
}

if ($userToken) {
  $h = Auth $userToken
  Invoke-Api GET "/users/me" "user" $h | Out-Null
  Invoke-Api GET "/extinguishers" "user" $h | Out-Null
  Invoke-Api GET "/reports/overview" "user" $h | Out-Null
  Invoke-Api GET "/reports/compliance" "user" $h | Out-Null
  Invoke-Api GET "/reports/maintenance" "user" $h -Expect @(200, 403) | Out-Null
}

if ($inspToken) {
  $h = Auth $inspToken
  Invoke-Api GET "/users/me" "inspector" $h | Out-Null
  Invoke-Api GET "/inspections" "inspector" $h | Out-Null
  Invoke-Api GET "/reports/overview" "inspector" $h | Out-Null
  Invoke-Api GET "/reports/maintenance" "inspector" $h | Out-Null
}

# Unauthorized
Invoke-Api GET "/users/me" "anon" @{} -Expect @(401) | Out-Null

$Results | Format-Table -AutoSize
$pass = ($Results | Where-Object { $_.Note -eq "OK" -or $_.Note -eq "Expected error" }).Count
$fail = $Results.Count - $pass
Write-Host "Summary: $pass passed, $fail failed/notes ($($Results.Count) total)"
$Results | ConvertTo-Json -Depth 3 | Set-Content -Path (Join-Path $PSScriptRoot "..\docs\api-test-results.json") -Encoding utf8
