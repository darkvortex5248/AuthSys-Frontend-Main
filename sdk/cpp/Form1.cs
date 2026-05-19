using AuthSysSDK;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;


namespace test
{
    public partial class Form1 : Form
    {
        private AuthSys auth;


        public Form1()
        {
            InitializeComponent();

            auth = new AuthSys(
                "abb8b5e8f0491c48998a9a786500c77b8d16b099a25d598344448c2801b20e71",
                "isrvYlPAEz0m",
                "1.0.0",
                "https://authsys-vtdu.onrender.com/api/v1"
            );
        }

        private async void guna2Button1_Click(object sender, EventArgs e)
        {
            try
            {
                var result = await auth.LoginAsync(
                    txtUsername.Text,
                    txtPassword.Text
                );

                if (result.TryGetProperty("success", out var successElement))
                {
                    bool success = successElement.GetBoolean();

                    if (success)
                    {
                        MessageBox.Show("Login Success");

                        Form2 form2 = new Form2();
                        form2.Show();

                        this.Hide();
                    }
                    else
                    {
                        string msg = "Login Failed";

                        if (result.TryGetProperty("message", out var msgElement))
                        {
                            msg = msgElement.GetString();
                        }

                        MessageBox.Show(msg);
                    }
                }
                else
                {
                    MessageBox.Show(
                        "API response does not contain 'success'\n\n" +
                        result.ToString()
                    );
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }





            try
            {
                var result = await auth.LicenseLoginAsync(
                    txtLicense.Text
                );

                if (result.TryGetProperty("success", out var successElement))
                {
                    bool success = successElement.GetBoolean();

                    if (success)
                    {
                        MessageBox.Show("Login Success");

                        Form2 form2 = new Form2();
                        form2.Show();

                        this.Hide();
                    }
                    else
                    {
                        string msg = "Login Failed";

                        if (result.TryGetProperty("message", out var msgElement))
                        {
                            msg = msgElement.GetString();
                        }

                        MessageBox.Show(msg);
                    }
                }
                else
                {
                    MessageBox.Show(result.ToString());
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }

        private void guna2ControlBox1_Click(object sender, EventArgs e)
        {
            Application.Exit(); 
        }

        private void txtLicense_TextChanged(object sender, EventArgs e)
        {

        }

        private void txtUsername_TextChanged(object sender, EventArgs e)
        {

        }

        private void txtPassword_TextChanged(object sender, EventArgs e)
        {

        }
    }
}
