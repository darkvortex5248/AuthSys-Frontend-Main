using AuthSysSDK;
using System;
using System.Text.Json;
using System.Windows.Forms;

namespace test
{
    public partial class Form1 : Form
    {
        private readonly AuthSys auth;

        public Form1()
        {
            InitializeComponent();

            // IMPORTANT: First value = App Secret (short key in dashboard "Secret Key")
            // NOT the Owner ID (long hash). Get it from Applications → your app → Secret Key.
            auth = new AuthSys(
                appSecret: "YOUR_APP_SECRET_HERE",
                version: "1.0.0",
                baseUrl: "https://authsys-vtdu.onrender.com/api/v1"
            );
        }

        private async void guna2Button1_Click(object sender, EventArgs e)
        {
            guna2Button1.Enabled = false;
            try
            {
                var init = await auth.InitAsync();
                if (init.TryGetProperty("success", out var initOk) && !initOk.GetBoolean())
                {
                    ShowApiMessage(init, "Init failed");
                    return;
                }

                JsonElement result;

                if (!string.IsNullOrWhiteSpace(txtLicense.Text))
                {
                    result = await auth.LicenseLoginAsync(txtLicense.Text.Trim());
                }
                else if (!string.IsNullOrWhiteSpace(txtUsername.Text))
                {
                    result = await auth.LoginAsync(txtUsername.Text.Trim(), txtPassword.Text);
                }
                else
                {
                    MessageBox.Show("Enter username/password OR a license key.");
                    return;
                }

                if (result.TryGetProperty("success", out var successEl) && successEl.GetBoolean())
                {
                    MessageBox.Show("Login successful!", "AuthSys", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    var form2 = new Form2();
                    form2.Show();
                    Hide();
                }
                else
                {
                    ShowApiMessage(result, "Login failed");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                guna2Button1.Enabled = true;
            }
        }

        private static void ShowApiMessage(JsonElement result, string fallback)
        {
            string msg = fallback;
            if (result.TryGetProperty("message", out var m))
                msg = m.GetString() ?? fallback;
            MessageBox.Show(msg, "AuthSys", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }

        private void guna2ControlBox1_Click(object sender, EventArgs e) => Application.Exit();
    }
}
