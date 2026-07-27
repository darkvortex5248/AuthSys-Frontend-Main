Imports System.Net.Http
Imports System.Text
Imports System.Text.Json
Imports System.Security.Cryptography
Imports System.Management

Namespace AuthSys
    Public Class AuthSysClient
        Private ReadOnly _appSecret As String
        Private ReadOnly _version As String
        Private ReadOnly _apiUrl As String
        Private ReadOnly _http As HttpClient

        Public Property SessionToken As String
        Public Property LastError As String
        Public Property LastResponse As String
        Public Property Initialized As Boolean
        Public Property Username As String
        Public Property Email As String
        Private _variables As String = "{}"

        Public Sub New(appSecret As String, version As String, Optional apiUrl As String = "https://api.authsys.dpdns.org/api/v1")
            _appSecret = appSecret
            _version = version
            _apiUrl = apiUrl.TrimEnd("/"c)
            _http = New HttpClient()
            _http.Timeout = TimeSpan.FromSeconds(30)
        End Sub

        Private Function GetHWID() As String
            Try
                Using mos As New ManagementObjectSearcher("SELECT VolumeSerialNumber FROM Win32_LogicalDisk WHERE DeviceID = 'C:'")
                    Using c = mos.Get().GetEnumerator()
                        If c.MoveNext() AndAlso c.Current("VolumeSerialNumber") IsNot Nothing Then
                            Return c.Current("VolumeSerialNumber").ToString()
                        End If
                    End Using
                End Using
            Catch
            End Try

            Try
                Using key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey("SOFTWARE\Microsoft\Cryptography")
                    If key IsNot Nothing Then
                        Dim guid = TryCast(key.GetValue("MachineGuid"), String)
                        If guid IsNot Nothing Then Return guid
                    End If
                End Using
            Catch
            End Try

            Return "FALLBACK_HWID"
        End Function

        Private Function GetJson(key As String, json As String) As String
            Try
                Using doc = JsonDocument.Parse(json)
                    If doc.RootElement.TryGetProperty(key, Nothing) Then
                        Dim val = doc.RootElement.GetProperty(key)
                        If val.ValueKind = JsonValueKind.String Then Return val.GetString()
                        Return val.GetRawText()
                    End If
                End Using
            Catch
            End Try
            Return ""
        End Function

        Private Async Function PostAsync(endpoint As String, jsonBody As String, Optional token As String = Nothing) As Task(Of String)
            Try
                Dim url = $"{_apiUrl}/client/{endpoint}"
                Dim req = New HttpRequestMessage(HttpMethod.Post, url)
                req.Content = New StringContent(jsonBody, Encoding.UTF8, "application/json")
                If token IsNot Nothing Then
                    req.Headers.Authorization = New Net.Http.Headers.AuthenticationHeaderValue("Bearer", token)
                    req.Headers.Add("X-HWID", GetHWID())
                End If
                Dim res = Await _http.SendAsync(req)
                Return Await res.Content.ReadAsStringAsync()
            Catch ex As Exception
                Dim safe = ex.Message.Replace("\", "\\").Replace("""", "\""").Replace(vbLf, "\n").Replace(vbCr, "\r").Replace(vbTab, "\t")
                Return $"{{\"success\":false,\"detail\":\"{safe}\"}}"
            End Try
        End Function

        Public Async Function InitAsync(Optional appName As String = "") As Task
            LastError = ""
            LastResponse = ""
            Initialized = False

            Dim json = $"{{\"app_secret\":\"{_appSecret}\",\"version\":\"{_version}\",\"hwid\":\"{GetHWID()}\",\"app_name\":\"{appName}\"}}"
            LastResponse = Await PostAsync("init", json)

            Dim status = GetJson("status", LastResponse)
            If status = "success" OrElse status = "update_available" Then
                Initialized = True
                Dim v = GetJson("variables", LastResponse)
                If Not String.IsNullOrEmpty(v) Then _variables = v
            Else
                LastError = GetJson("detail", LastResponse)
                If String.IsNullOrEmpty(LastError) Then LastError = "Init failed"
            End If
        End Function

        Public Async Function LoginAsync(username As String, password As String, Optional sessionLength As Integer = 86400) As Task
            SessionToken = Nothing
            LastError = ""
            LastResponse = ""

            Dim json = $"{{\"app_secret\":\"{_appSecret}\",\"username\":\"{username}\",\"password\":\"{password}\",\"hwid\":\"{GetHWID()}\",\"session_length\":{sessionLength}}}"
            LastResponse = Await PostAsync("login", json)

            Dim detail = GetJson("detail", LastResponse)
            If Not String.IsNullOrEmpty(detail) Then LastError = detail : Return

            Dim success = GetJson("success", LastResponse)
            If success = "true" Then
                SessionToken = GetJson("token", LastResponse)
                Username = username
                Email = GetJson("email", LastResponse)
            Else
                LastError = "Login failed"
            End If
        End Function

        Public Async Function RegisterAsync(username As String, password As String, licenseKey As String, Optional email As String = "") As Task
            LastError = ""
            LastResponse = ""

            Dim json = $"{{\"app_secret\":\"{_appSecret}\",\"username\":\"{username}\",\"password\":\"{password}\",\"license_key\":\"{licenseKey}\",\"hwid\":\"{GetHWID()}\""
            If Not String.IsNullOrEmpty(email) Then json += $",\"email\":\"{email}\""
            json += "}"

            LastResponse = Await PostAsync("register", json)

            Dim detail = GetJson("detail", LastResponse)
            If Not String.IsNullOrEmpty(detail) Then LastError = detail : Return

            Dim success = GetJson("success", LastResponse)
            If success <> "true" Then LastError = "Registration failed"
        End Function

        Public Async Function LicenseLoginAsync(licenseKey As String, Optional sessionLength As Integer = 86400) As Task
            SessionToken = Nothing
            LastError = ""
            LastResponse = ""

            Dim json = $"{{\"app_secret\":\"{_appSecret}\",\"license_key\":\"{licenseKey}\",\"hwid\":\"{GetHWID()}\",\"session_length\":{sessionLength}}}"
            LastResponse = Await PostAsync("license-login", json)

            Dim detail = GetJson("detail", LastResponse)
            If Not String.IsNullOrEmpty(detail) Then LastError = detail : Return

            Dim success = GetJson("success", LastResponse)
            If success = "true" Then
                SessionToken = GetJson("token", LastResponse)
                Username = GetJson("username", LastResponse)
            Else
                LastError = "License login failed"
            End If
        End Function

        Public Async Function LicenseCheckAsync(licenseKey As String) As Task
            LastError = ""
            LastResponse = ""
            Dim json = $"{{\"app_secret\":\"{_appSecret}\",\"license_key\":\"{licenseKey}\"}}"
            LastResponse = Await PostAsync("license/check", json)
        End Function

        Public Async Function VerifyAsync() As Task
            LastError = ""
            LastResponse = ""
            If String.IsNullOrEmpty(SessionToken) Then LastError = "No active session" : Return
            LastResponse = Await PostAsync("verify", "{}", SessionToken)
            Dim valid = GetJson("valid", LastResponse)
            If valid <> "true" Then
                LastError = GetJson("detail", LastResponse)
                If String.IsNullOrEmpty(LastError) Then LastError = "Session verification failed"
            End If
        End Function

        Public Async Function ChatSendAsync(roomId As Integer, message As String) As Task
            LastError = ""
            LastResponse = ""
            Dim endpoint = $"chat/send?room_id={roomId}&message={Uri.EscapeDataString(message)}"
            LastResponse = Await PostAsync(endpoint, "{}", SessionToken)
        End Function

        Public Function Var(name As String) As String
            Return GetJson(name, _variables)
        End Function

        Public Sub Logout()
            SessionToken = Nothing
            Username = Nothing
            Email = Nothing
            LastError = ""
            LastResponse = ""
        End Sub
    End Class
End Namespace
