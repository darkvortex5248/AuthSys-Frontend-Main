Imports AuthSys

Module Main
    Sub Main()
        Dim auth As New AuthSysClient("your_app_secret", "1.0.0")

        auth.InitAsync().Wait()
        If Not auth.Initialized Then
            Console.WriteLine($"Init failed: {auth.LastError}")
            Return
        End If

        Console.WriteLine("1. Login" & vbCrLf & "2. Register" & vbCrLf & "3. License Login")
        Console.Write("Choose: ")
        Dim opt = Console.ReadLine()

        Select Case opt
            Case "1"
                Console.Write("Username: ")
                Dim user = Console.ReadLine()
                Console.Write("Password: ")
                Dim pass = Console.ReadLine()
                auth.LoginAsync(user, pass).Wait()
                If auth.SessionToken IsNot Nothing Then
                    Console.WriteLine($"Welcome {auth.Username}!")
                Else
                    Console.WriteLine($"Login failed: {auth.LastError}")
                End If

            Case "2"
                Console.Write("Username: ")
                Dim user = Console.ReadLine()
                Console.Write("Password: ")
                Dim pass = Console.ReadLine()
                Console.Write("License Key: ")
                Dim key = Console.ReadLine()
                auth.RegisterAsync(user, pass, key).Wait()
                Console.WriteLine(If(String.IsNullOrEmpty(auth.LastError), "Registered!", $"Failed: {auth.LastError}"))

            Case "3"
                Console.Write("License Key: ")
                Dim key = Console.ReadLine()
                auth.LicenseLoginAsync(key).Wait()
                If auth.SessionToken IsNot Nothing Then
                    Console.WriteLine($"Welcome {auth.Username}!")
                Else
                    Console.WriteLine($"License login failed: {auth.LastError}")
                End If
        End Select
    End Sub
End Module
