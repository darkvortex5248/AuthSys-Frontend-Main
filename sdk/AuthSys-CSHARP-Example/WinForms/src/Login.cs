using System;
using System.Drawing;
using System.Threading.Tasks;
using System.Windows.Forms;
using AuthSys;

namespace AuthSysWinFormsExample
{
    public partial class LoginForm : Form
    {
        private AuthSys.AuthSys _auth;
        private TextBox txtUsername;
        private TextBox txtPassword;
        private TextBox txtLicenseKey;
        private Button btnLogin;
        private Button btnLicenseLogin;
        private Button btnRegister;

        public LoginForm()
        {
            InitializeComponent();
            InitializeAuth();
        }

        private async void InitializeAuth()
        {
            var options = new AuthSysOptions
            {
                AppSecret = "YOUR_APP_SECRET",
                AppName = "MyApplication",
                Version = "1.0.0",
                EnableLogging = true
            };
            _auth = new AuthSys.AuthSys(options);

            try
            {
                var result = await _auth.InitAsync();
                var status = result.ContainsKey("status") ? result["status"].ToString() ?? "" : "";
                if (status == "update_required")
                {
                    var msg = result.ContainsKey("message") ? result["message"].ToString() ?? "" : "";
                    MessageBox.Show($"Update required: {msg}", "Update Required", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    Application.Exit();
                    return;
                }
            }
            catch (AuthSysException ex)
            {
                MessageBox.Show($"Init failed: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void InitializeComponent()
        {
            this.Text = "AuthSys Login";
            this.Size = new Size(400, 350);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;

            var lblTitle = new Label { Text = "AuthSys Login", Font = new Font("Segoe UI", 16, FontStyle.Bold), Location = new Point(100, 20), Size = new Size(200, 30), TextAlign = ContentAlignment.MiddleCenter };
            txtUsername = new TextBox { Location = new Point(50, 70), Size = new Size(300, 25) };
            txtPassword = new TextBox { Location = new Point(50, 110), Size = new Size(300, 25), PasswordChar = '*' };
            txtLicenseKey = new TextBox { Location = new Point(50, 150), Size = new Size(300, 25) };

            btnLogin = new Button { Text = "Login", Location = new Point(50, 200), Size = new Size(140, 35) };
            btnLicenseLogin = new Button { Text = "License Login", Location = new Point(210, 200), Size = new Size(140, 35) };
            btnRegister = new Button { Text = "Register", Location = new Point(130, 245), Size = new Size(140, 35) };

            btnLogin.Click += async (s, e) => await Login();
            btnLicenseLogin.Click += async (s, e) => await LicenseLogin();
            btnRegister.Click += (s, e) => new RegisterForm(_auth).ShowDialog();

            this.Controls.AddRange(new Control[] { lblTitle, txtUsername, txtPassword, txtLicenseKey, btnLogin, btnLicenseLogin, btnRegister });
        }

        private async Task Login()
        {
            try
            {
                var result = await _auth.LoginAsync(txtUsername.Text, txtPassword.Text);
                var success = result.ContainsKey("success") && result["success"].ToString() == "True";
                if (success)
                {
                    new DashboardForm(_auth, result.ContainsKey("username") ? result["username"].ToString() ?? "" : "").Show();
                    this.Hide();
                }
            }
            catch (AuthSysException ex)
            {
                MessageBox.Show(ex.Message, "Login Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async Task LicenseLogin()
        {
            try
            {
                var result = await _auth.LicenseLoginAsync(txtLicenseKey.Text);
                var success = result.ContainsKey("success") && result["success"].ToString() == "True";
                if (success)
                {
                    new DashboardForm(_auth, result.ContainsKey("username") ? result["username"].ToString() ?? "" : "").Show();
                    this.Hide();
                }
            }
            catch (AuthSysException ex)
            {
                MessageBox.Show(ex.Message, "License Login Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }

    public class DashboardForm : Form
    {
        private AuthSys.AuthSys _auth;

        public DashboardForm(AuthSys.AuthSys auth, string username)
        {
            _auth = auth;
            this.Text = $"Dashboard - {username}";
            this.Size = new Size(500, 400);
            this.StartPosition = FormStartPosition.CenterScreen;

            var lblWelcome = new Label { Text = $"Welcome, {username}!", Font = new Font("Segoe UI", 14, FontStyle.Bold), Location = new Point(20, 20), Size = new Size(300, 30) };
            var btnVerify = new Button { Text = "Verify Session", Location = new Point(20, 70), Size = new Size(150, 35) };
            var btnLogout = new Button { Text = "Logout", Location = new Point(20, 115), Size = new Size(150, 35) };
            var txtStatus = new TextBox { Location = new Point(20, 160), Size = new Size(440, 100), Multiline = true, ScrollBars = ScrollBars.Vertical, ReadOnly = true };

            btnVerify.Click += async (s, e) =>
            {
                try
                {
                    var result = await _auth.VerifyAsync();
                    var valid = result.ContainsKey("valid") ? result["valid"].ToString() : "False";
                    var username = result.ContainsKey("username") ? result["username"].ToString() ?? "" : "";
                    txtStatus.Text = $"Valid: {valid}\nUsername: {username}";
                }
                catch (AuthSysException ex)
                {
                    txtStatus.Text = $"Error: {ex.Message}";
                }
            };

            btnLogout.Click += (s, e) => { _auth.Logout(); this.Close(); };

            this.Controls.AddRange(new Control[] { lblWelcome, btnVerify, btnLogout, txtStatus });
        }
    }

    public class RegisterForm : Form
    {
        private AuthSys.AuthSys _auth;

        public RegisterForm(AuthSys.AuthSys auth)
        {
            _auth = auth;
            this.Text = "Register";
            this.Size = new Size(400, 300);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;

            var txtUsername = new TextBox { Location = new Point(50, 30), Size = new Size(300, 25) };
            var txtPassword = new TextBox { Location = new Point(50, 70), Size = new Size(300, 25), PasswordChar = '*' };
            var txtLicenseKey = new TextBox { Location = new Point(50, 110), Size = new Size(300, 25) };
            var btnRegister = new Button { Text = "Register", Location = new Point(130, 160), Size = new Size(140, 35) };

            btnRegister.Click += async (s, e) =>
            {
                try
                {
                    var result = await _auth.RegisterAsync(txtUsername.Text, txtPassword.Text, txtLicenseKey.Text);
                    var msg = result.ContainsKey("message") ? result["message"].ToString() ?? "Registered" : "Registered";
                    MessageBox.Show(msg, "Registration", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    this.Close();
                }
                catch (AuthSysException ex)
                {
                    MessageBox.Show(ex.Message, "Registration Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            };

            this.Controls.AddRange(new Control[] { txtUsername, txtPassword, txtLicenseKey, btnRegister });
        }
    }

    public static class Program
    {
        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new LoginForm());
        }
    }
}
