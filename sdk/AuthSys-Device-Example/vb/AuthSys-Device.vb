Imports System.Net.Http
Imports System.Text
Imports System.Management

Namespace AuthSysDevice
    Public Class Device
        Private ReadOnly _appSecret As String
        Private ReadOnly _baseUrl As String
        Private ReadOnly _client As HttpClient

        Public Property LastError As String = ""
        Public Property LastResponse As String = ""

        Public Sub New(appSecret As String, Optional baseUrl As String = "https://api.authsys.dpdns.org/api/v1/client")
            _appSecret = appSecret
            _baseUrl = baseUrl.TrimEnd("/"c)
            _client = New HttpClient()
            _client.Timeout = TimeSpan.FromSeconds(15)
        End Sub

        Private Shared Function GetHWID() As String
            Try
                Using searcher As New ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BIOS")
                    For Each obj In searcher.Get()
                        If obj("SerialNumber") IsNot Nothing Then
                            Return obj("SerialNumber").ToString().Trim()
                        End If
                    Next
                End Using
            Catch
            End Try
            Return "unknown"
        End Function

        Public Function Check() As Boolean
            LastError = ""
            Try
                Dim hwid As String = GetHWID()
                Dim json As String = $"{{\"group_secret\":\"{_appSecret}\",\"hwid\":\"{hwid}\"}}"
                Dim content As New StringContent(json, Encoding.UTF8, "application/json")
                Dim response = _client.PostAsync($"{_baseUrl}/check", content).GetAwaiter().GetResult()
                LastResponse = response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
                Dim obj = Newtonsoft.Json.Linq.JObject.Parse(LastResponse)
                If obj("active")?.Value(Of Boolean)() = True Then Return True
                LastError = If(obj("message")?.Value(Of String)(), "Device deactivated by admin")
                Return False
            Catch ex As Exception
                LastError = ex.Message
                Return False
            End Try
        End Function

        Public Function Register(Optional deviceName As String = "") As Boolean
            LastError = ""
            Try
                Dim hwid As String = GetHWID()
                Dim json As String = $"{{\"group_secret\":\"{_appSecret}\",\"hwid\":\"{hwid}\""
                If Not String.IsNullOrEmpty(deviceName) Then
                    json += $",\"device_name\":\"{deviceName}\""
                End If
                json += "}"
                Dim content As New StringContent(json, Encoding.UTF8, "application/json")
                Dim response = _client.PostAsync($"{_baseUrl}/register", content).GetAwaiter().GetResult()
                LastResponse = response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
                Dim obj = Newtonsoft.Json.Linq.JObject.Parse(LastResponse)
                Return obj("active")?.Value(Of Boolean)() = True
            Catch ex As Exception
                LastError = ex.Message
                Return False
            End Try
        End Function
    End Class
End Namespace

