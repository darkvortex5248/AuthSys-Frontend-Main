using System;
using System.Threading;

namespace AuthSys.Example
{
    class Program
    {
        public static api AuthSysApp = new api(
            name: "TestApp",
            ownerid: "your_owner_id",
            secret: "your_app_secret",
            version: "1.0",
            apiUrl: "https://authsys-main-production.up.railway.app/api/v1"
        );

        static void Main(string[] args)
        {
            Console.Title = "AuthSys Example";
            Console.WriteLine("\n\n Connecting..");
            AuthSysApp.init();

            if (!AuthSysApp.initialized)
            {
                Console.WriteLine("\n Status: " + AuthSysApp.response.detail);
                Thread.Sleep(1500);
                Environment.Exit(0);
            }
            
            Console.WriteLine("\n [1] Login\n [2] Register\n [3] License key only\n\n Choose option: ");
            int option = int.Parse(Console.ReadLine());

            string username, password, key;

            switch (option)
            {
                case 1:
                    Console.Write("\n\n Enter username: ");
                    username = Console.ReadLine();
                    Console.Write("\n\n Enter password: ");
                    password = Console.ReadLine();
                    AuthSysApp.login(username, password);
                    break;
                case 2:
                    Console.Write("\n\n Enter username: ");
                    username = Console.ReadLine();
                    Console.Write("\n\n Enter password: ");
                    password = Console.ReadLine();
                    Console.Write("\n\n Enter license: ");
                    key = Console.ReadLine();
                    AuthSysApp.register(username, password, key);
                    break;
                case 3:
                    Console.Write("\n\n Enter license: ");
                    key = Console.ReadLine();
                    AuthSysApp.license(key);
                    break;
                default:
                    Console.WriteLine("\n Invalid option");
                    Environment.Exit(0);
                    break;
            }

            if (!string.IsNullOrEmpty(AuthSysApp.sessionid) || AuthSysApp.response.message == "User registered successfully")
            {
                Console.WriteLine("\n Success! " + (AuthSysApp.response.message ?? "Logged in successfully."));
                
                string motd = AuthSysApp.var("motd");
                if (!string.IsNullOrEmpty(motd))
                {
                    Console.WriteLine($"\n MOTD: {motd}");
                }

                Console.WriteLine("\n [Main Application Running...]");
            }
            else
            {
                Console.WriteLine("\n Failed: " + AuthSysApp.response.detail);
            }

            Console.ReadLine();
        }
    }
}
