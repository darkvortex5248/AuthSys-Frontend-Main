using System;
using System.Windows.Forms;
using AuthSys;

namespace AuthSys.Example.Form
{
    public partial class Login : System.Windows.Forms.Form
    {
        public static api AuthSysApp = new api(
            name: "TestApp",
            ownerid: "your_owner_id",
            secret: "your_app_secret",
            version: "1.0"
        );

        public Login()
        {
            InitializeComponent();
        }

        private void Login_Load(object sender, EventArgs e)
        {
            AuthSysApp.init();

            if (!AuthSysApp.initialized)
            {
                MessageBox.Show(AuthSysApp.lastError, "Init Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Environment.Exit(0);
            }
        }

        private void btnLogin_Click(object sender, EventArgs e)
        {
            AuthSysApp.login(txtUsername.Text, txtPassword.Text);

            if (!string.IsNullOrEmpty(AuthSysApp.sessionToken))
            {
                MessageBox.Show("Logged in successfully!", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            else
            {
                MessageBox.Show(AuthSysApp.lastError, "Login Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnRegister_Click(object sender, EventArgs e)
        {
            AuthSysApp.register(txtUsername.Text, txtPassword.Text, txtLicense.Text);

            if (AuthSysApp.response.message == "User registered successfully" || !string.IsNullOrEmpty(AuthSysApp.sessionToken))
            {
                MessageBox.Show("Registered successfully!", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            else
            {
                MessageBox.Show(AuthSysApp.lastError, "Registration Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnLicense_Click(object sender, EventArgs e)
        {
            AuthSysApp.licenseLogin(txtLicense.Text);

            if (!string.IsNullOrEmpty(AuthSysApp.sessionToken))
            {
                MessageBox.Show("Logged in with License successfully!", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            else
            {
                MessageBox.Show(AuthSysApp.lastError, "License Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private TextBox txtUsername = new TextBox();
        private TextBox txtPassword = new TextBox();
        private TextBox txtLicense = new TextBox();
        private void InitializeComponent() { }
    }
}
