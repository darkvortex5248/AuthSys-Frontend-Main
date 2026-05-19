using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;
using AuthSysSDK;

namespace AuthSysDesktopClient
{
    public class Form1 : Form
    {
        // P/Invoke for smooth borderless window dragging
        [DllImport("user32.dll")]
        private static extern bool ReleaseCapture();
        [DllImport("user32.dll")]
        private static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);

        private const int WM_NCLBUTTONDOWN = 0xA1;
        private const int HT_CAPTION = 0x2;

        // Custom Colors (Premium Dark Palette)
        private static readonly Color ColorBg = Color.FromArgb(20, 20, 26);
        private static readonly Color ColorCard = Color.FromArgb(30, 30, 40);
        private static readonly Color ColorAccent = Color.FromArgb(124, 77, 255); // Neon Purple
        private static readonly Color ColorAccentHover = Color.FromArgb(101, 31, 255);
        private static readonly Color ColorTextMain = Color.FromArgb(245, 245, 250);
        private static readonly Color ColorTextMuted = Color.FromArgb(140, 140, 160);
        private static readonly Color ColorBorder = Color.FromArgb(50, 50, 70);
        private static readonly Color ColorGreen = Color.FromArgb(0, 230, 118);
        private static readonly Color ColorRed = Color.FromArgb(255, 23, 68);

        // Core SDK Instance
        private AuthSys _authClient;

        // Controls
        private Panel _titleBar;
        private Label _lblTitle;
        private Button _btnClose;
        private Button _btnMin;
        private Panel _mainContainer;
        private Panel _sidebar;
        private Panel _contentPanel;

        // Sidebar Navigation
        private Button _btnTabLogin;
        private Button _btnTabRegister;
        private Button _btnTabLicenseOnly;
        private Button _btnTabStatus;

        // Active State indicator line in sidebar
        private Panel _activeIndicator;

        // Tab Views (Containers)
        private Panel _viewLogin;
        private Panel _viewRegister;
        private Panel _viewLicenseOnly;
        private Panel _viewDashboard;

        // Status bar / Log
        private Label _lblStatus;

        // Login Controls
        private FlatTextBox _txtLoginUser;
        private FlatTextBox _txtLoginPass;
        private ModernButton _btnLogin;

        // Register Controls
        private FlatTextBox _txtRegUser;
        private FlatTextBox _txtRegPass;
        private FlatTextBox _txtRegEmail;
        private FlatTextBox _txtRegLicense;
        private ModernButton _btnRegister;

        // License Only Controls
        private FlatTextBox _txtLicOnlyKey;
        private ModernButton _btnLicOnlyLogin;

        // Dashboard Controls
        private Label _lblDashWelcome;
        private Label _lblDashHwid;
        private Label _lblDashExpires;
        private Label _lblDashRole;
        private ModernButton _btnDashLogout;

        // Credentials & Config (Top level inputs in sidebar/header for easy testing)
        private FlatTextBox _txtAppSecret;
        private FlatTextBox _txtBaseUrl;

        public Form1()
        {
            InitializeComponent();
            SetupEventHandlers();
            SwitchToView("login");
        }

        private void InitializeComponent()
        {
            this.Size = new Size(880, 560);
            this.FormBorderStyle = FormBorderStyle.None;
            this.BackColor = ColorBg;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.DoubleBuffered = true;

            // Form shadow (via Win32 CreateParams)
            this.SetStyle(ControlStyles.ResizeRedraw, true);

            // 1. Custom Title Bar
            _titleBar = new Panel
            {
                Size = new Size(this.Width, 40),
                Location = new Point(0, 0),
                BackColor = Color.FromArgb(15, 15, 20),
                Cursor = Cursors.SizeAll
            };

            _lblTitle = new Label
            {
                Text = "AuthSys — Modern C# Integration Client",
                ForeColor = ColorTextMain,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                Location = new Point(15, 10),
                AutoSize = true,
                Cursor = Cursors.SizeAll
            };

            _btnClose = new Button
            {
                Text = "✕",
                Size = new Size(40, 40),
                Location = new Point(this.Width - 40, 0),
                FlatStyle = FlatStyle.Flat,
                ForeColor = ColorTextMuted,
                BackColor = Color.Transparent,
                Cursor = Cursors.Hand
            };
            _btnClose.FlatAppearance.BorderSize = 0;
            _btnClose.FlatAppearance.MouseOverBackColor = ColorRed;
            _btnClose.FlatAppearance.MouseDownBackColor = Color.FromArgb(200, 0, 0);

            _btnMin = new Button
            {
                Text = "—",
                Size = new Size(40, 40),
                Location = new Point(this.Width - 80, 0),
                FlatStyle = FlatStyle.Flat,
                ForeColor = ColorTextMuted,
                BackColor = Color.Transparent,
                Cursor = Cursors.Hand
            };
            _btnMin.FlatAppearance.BorderSize = 0;
            _btnMin.FlatAppearance.MouseOverBackColor = Color.FromArgb(40, 40, 50);

            _titleBar.Controls.Add(_lblTitle);
            _titleBar.Controls.Add(_btnClose);
            _titleBar.Controls.Add(_btnMin);
            this.Controls.Add(_titleBar);

            // 2. Sidebar Layout
            _sidebar = new Panel
            {
                Size = new Size(220, this.Height - 40),
                Location = new Point(0, 40),
                BackColor = Color.FromArgb(17, 17, 23)
            };

            Label lblConfigTitle = new Label
            {
                Text = "API CONFIGURATION",
                ForeColor = ColorAccent,
                Font = new Font("Segoe UI", 8F, FontStyle.Bold),
                Location = new Point(15, 15),
                AutoSize = true
            };
            _sidebar.Controls.Add(lblConfigTitle);

            _txtAppSecret = new FlatTextBox("App Secret")
            {
                Location = new Point(15, 40),
                Size = new Size(190, 36)
            };
            _txtAppSecret.Text = "6ba51c1a938640a4b08f435c6d376889"; // Default test secret
            _sidebar.Controls.Add(_txtAppSecret);

            _txtBaseUrl = new FlatTextBox("Base URL")
            {
                Location = new Point(15, 85),
                Size = new Size(190, 36)
            };
            _txtBaseUrl.Text = "http://localhost:8000"; // Default test URL
            _sidebar.Controls.Add(_txtBaseUrl);

            // Navigation Buttons
            _btnTabLogin = CreateSidebarButton("Login Auth", 150);
            _btnTabRegister = CreateSidebarButton("Register", 195);
            _btnTabLicenseOnly = CreateSidebarButton("License Only", 240);

            _sidebar.Controls.Add(_btnTabLogin);
            _sidebar.Controls.Add(_btnTabRegister);
            _sidebar.Controls.Add(_btnTabLicenseOnly);

            // Indicator line
            _activeIndicator = new Panel
            {
                BackColor = ColorAccent,
                Size = new Size(4, 30),
                Location = new Point(5, 157)
            };
            _sidebar.Controls.Add(_activeIndicator);

            this.Controls.Add(_sidebar);

            // 3. Content Panel
            _contentPanel = new Panel
            {
                Size = new Size(this.Width - 220, this.Height - 40 - 50),
                Location = new Point(220, 40),
                BackColor = ColorBg
            };
            this.Controls.Add(_contentPanel);

            // 4. Status Bar / Bottom Banner
            _lblStatus = new Label
            {
                Text = "Ready. Set credentials and choose authentication flow.",
                ForeColor = ColorTextMuted,
                Font = new Font("Segoe UI", 9F, FontStyle.Italic),
                Size = new Size(this.Width - 220, 50),
                Location = new Point(220, this.Height - 50),
                TextAlign = ContentAlignment.MiddleCenter,
                BackColor = Color.FromArgb(16, 16, 22)
            };
            this.Controls.Add(_lblStatus);

            // -------------------- VIEWS SETUP --------------------

            // A. LOGIN VIEW
            _viewLogin = CreateCardView("SECURE CLIENT SIGN IN", "Enter your credentials to connect with AuthSys authentication server.");

            _txtLoginUser = new FlatTextBox("Username")
            {
                Location = new Point(40, 110),
                Size = new Size(320, 40)
            };
            _txtLoginPass = new FlatTextBox("Password")
            {
                Location = new Point(40, 170),
                Size = new Size(320, 40),
                UsePasswordChar = true
            };
            _btnLogin = new ModernButton("Sign In")
            {
                Location = new Point(40, 240),
                Size = new Size(320, 45)
            };

            _viewLogin.Controls.Add(_txtLoginUser);
            _viewLogin.Controls.Add(_txtLoginPass);
            _viewLogin.Controls.Add(_btnLogin);
            _contentPanel.Controls.Add(_viewLogin);

            // B. REGISTER VIEW
            _viewRegister = CreateCardView("CREATE CLIENT ACCOUNT", "Use a valid license key to register a new user credential.");

            _txtRegUser = new FlatTextBox("Username")
            {
                Location = new Point(40, 90),
                Size = new Size(230, 40)
            };
            _txtRegPass = new FlatTextBox("Password")
            {
                Location = new Point(290, 90),
                Size = new Size(230, 40),
                UsePasswordChar = true
            };
            _txtRegEmail = new FlatTextBox("Email Address (Optional)")
            {
                Location = new Point(40, 150),
                Size = new Size(480, 40)
            };
            _txtRegLicense = new FlatTextBox("License Key")
            {
                Location = new Point(40, 210),
                Size = new Size(480, 40)
            };
            _btnRegister = new ModernButton("Register Account")
            {
                Location = new Point(40, 280),
                Size = new Size(480, 45)
            };

            _viewRegister.Controls.Add(_txtRegUser);
            _viewRegister.Controls.Add(_txtRegPass);
            _viewRegister.Controls.Add(_txtRegEmail);
            _viewRegister.Controls.Add(_txtRegLicense);
            _viewRegister.Controls.Add(_btnRegister);
            _contentPanel.Controls.Add(_viewRegister);

            // C. LICENSE ONLY VIEW
            _viewLicenseOnly = CreateCardView("LICENSE-KEY AUTHENTICATION", "Bypass traditional credentials. Log in directly using your valid subscription license key.");

            _txtLicOnlyKey = new FlatTextBox("License Key")
            {
                Location = new Point(40, 130),
                Size = new Size(480, 40)
            };
            _btnLicOnlyLogin = new ModernButton("Verify & Login License")
            {
                Location = new Point(40, 200),
                Size = new Size(480, 45)
            };

            _viewLicenseOnly.Controls.Add(_txtLicOnlyKey);
            _viewLicenseOnly.Controls.Add(_btnLicOnlyLogin);
            _contentPanel.Controls.Add(_viewLicenseOnly);

            // D. DASHBOARD VIEW (AUTHENTICATED)
            _viewDashboard = CreateCardView("USER SECURE SESSION", "Welcome to your protected workspace. Your identity is verified and hardware ID is locked.");

            _lblDashWelcome = new Label
            {
                Text = "Session Active: User",
                Font = new Font("Segoe UI Semibold", 14F, FontStyle.Bold),
                ForeColor = ColorGreen,
                Location = new Point(40, 90),
                AutoSize = true
            };

            _lblDashRole = new Label
            {
                Text = "Security Level: Premium Subscription Member",
                Font = new Font("Segoe UI", 10F),
                ForeColor = ColorTextMain,
                Location = new Point(40, 130),
                AutoSize = true
            };

            _lblDashExpires = new Label
            {
                Text = "Subscription Expiration: 2026-12-31 23:59:59 UTC",
                Font = new Font("Segoe UI", 10F),
                ForeColor = ColorTextMuted,
                Location = new Point(40, 165),
                AutoSize = true
            };

            _lblDashHwid = new Label
            {
                Text = "Locked Hardware ID: FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
                Font = new Font("Segoe UI", 9F, FontStyle.Italic),
                ForeColor = ColorTextMuted,
                Location = new Point(40, 200),
                AutoSize = true
            };

            _btnDashLogout = new ModernButton("Terminate Secure Session")
            {
                Location = new Point(40, 260),
                Size = new Size(240, 40),
                BackColor = Color.FromArgb(40, 30, 40)
            };

            _viewDashboard.Controls.Add(_lblDashWelcome);
            _viewDashboard.Controls.Add(_lblDashRole);
            _viewDashboard.Controls.Add(_lblDashExpires);
            _viewDashboard.Controls.Add(_lblDashHwid);
            _viewDashboard.Controls.Add(_btnDashLogout);
            _contentPanel.Controls.Add(_viewDashboard);
        }

        private void SetupEventHandlers()
        {
            // Drag form via titlebar
            _titleBar.MouseDown += (s, e) =>
            {
                if (e.Button == MouseButtons.Left)
                {
                    ReleaseCapture();
                    SendMessage(this.Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
                }
            };
            _lblTitle.MouseDown += (s, e) =>
            {
                if (e.Button == MouseButtons.Left)
                {
                    ReleaseCapture();
                    SendMessage(this.Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
                }
            };

            _btnClose.Click += (s, e) => Application.Exit();
            _btnMin.Click += (s, e) => this.WindowState = FormWindowStateMinimized;

            // Nav Tabs
            _btnTabLogin.Click += (s, e) => SwitchToView("login");
            _btnTabRegister.Click += (s, e) => SwitchToView("register");
            _btnTabLicenseOnly.Click += (s, e) => SwitchToView("license");

            // Auth Logic Triggers
            _btnLogin.Click += async (s, e) => await HandleLogin();
            _btnRegister.Click += async (s, e) => await HandleRegister();
            _btnLicOnlyLogin.Click += async (s, e) => await HandleLicenseOnlyLogin();
            _btnDashLogout.Click += (s, e) => HandleLogout();
        }

        // Initialize dynamic client based on input secret and base URL
        private bool EnsureClient()
        {
            string secret = _txtAppSecret.Text.Trim();
            string baseUrl = _txtBaseUrl.Text.Trim();

            if (string.IsNullOrEmpty(secret))
            {
                UpdateStatus("Error: App Secret is required.", true);
                return false;
            }

            if (_authClient == null || _authClient.AppSecret != secret || _authClient.BaseUrl != baseUrl)
            {
                _authClient = new AuthSys(secret, "1.0.0", baseUrl);
            }
            return true;
        }

        private async Task HandleLogin()
        {
            if (!EnsureClient()) return;

            string username = _txtLoginUser.Text.Trim();
            string password = _txtLoginPass.Text.Trim();

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                UpdateStatus("Please fill in username and password fields.", true);
                return;
            }

            UpdateStatus("Initializing client handshake...", false);
            _btnLogin.Enabled = false;

            try
            {
                var initRes = await _authClient.InitAsync();
                if (!initRes.TryGetProperty("success", out var successEl) || !successEl.GetBoolean())
                {
                    string msg = initRes.TryGetProperty("message", out var msgEl) ? msgEl.GetString() : "Init failed";
                    UpdateStatus("Handshake failed: " + msg, true);
                    return;
                }

                UpdateStatus("Authenticating credentials...", false);
                var loginRes = await _authClient.LoginAsync(username, password);

                if (loginRes.TryGetProperty("success", out var okEl) && okEl.GetBoolean())
                {
                    UpdateStatus("Authenticated successfully. Preparing dashboard...", false);
                    string expiresStr = "Never";
                    if (loginRes.TryGetProperty("expires_at", out var expEl))
                        expiresStr = expEl.GetString();
                    else if (loginRes.TryGetProperty("license", out var licEl) && licEl.TryGetProperty("expires_at", out var licExpEl))
                        expiresStr = licExpEl.GetString();

                    string userRole = "Subscriber";
                    if (loginRes.TryGetProperty("role", out var roleEl))
                        userRole = roleEl.GetString();

                    _lblDashWelcome.Text = "Session Active: " + username;
                    _lblDashRole.Text = "Access Role: " + userRole;
                    _lblDashExpires.Text = "Subscription Expiration: " + expiresStr;
                    _lblDashHwid.Text = "HWID: " + _authClient.Hwid;

                    SwitchToView("dashboard");
                    UpdateStatus("Signed in as " + username + ".", false);
                }
                else
                {
                    string msg = loginRes.TryGetProperty("message", out var msgEl) ? msgEl.GetString() : "Login failed";
                    UpdateStatus("Auth Failed: " + msg, true);
                }
            }
            catch (Exception ex)
            {
                UpdateStatus("Network error: " + ex.Message, true);
            }
            finally
            {
                _btnLogin.Enabled = true;
            }
        }

        private async Task HandleRegister()
        {
            if (!EnsureClient()) return;

            string username = _txtRegUser.Text.Trim();
            string password = _txtRegPass.Text.Trim();
            string email = _txtRegEmail.Text.Trim();
            string license = _txtRegLicense.Text.Trim();

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password) || string.IsNullOrEmpty(license))
            {
                UpdateStatus("Please fill in username, password, and license key.", true);
                return;
            }

            UpdateStatus("Validating license & creating account...", false);
            _btnRegister.Enabled = false;

            try
            {
                var regRes = await _authClient.RegisterAsync(username, password, license, email);
                if (regRes.TryGetProperty("success", out var okEl) && okEl.GetBoolean())
                {
                    UpdateStatus("Registration complete! You can now log in.", false);
                    _txtLoginUser.Text = username;
                    _txtLoginPass.Text = password;
                    SwitchToView("login");
                }
                else
                {
                    string msg = regRes.TryGetProperty("message", out var msgEl) ? msgEl.GetString() : "Registration failed";
                    UpdateStatus("Register Failed: " + msg, true);
                }
            }
            catch (Exception ex)
            {
                UpdateStatus("Network error: " + ex.Message, true);
            }
            finally
            {
                _btnRegister.Enabled = true;
            }
        }

        private async Task HandleLicenseOnlyLogin()
        {
            if (!EnsureClient()) return;

            string license = _txtLicOnlyKey.Text.Trim();

            if (string.IsNullOrEmpty(license))
            {
                UpdateStatus("Please provide a valid license key.", true);
                return;
            }

            UpdateStatus("Handshake with authentication server...", false);
            _btnLicOnlyLogin.Enabled = false;

            try
            {
                var initRes = await _authClient.InitAsync();
                if (!initRes.TryGetProperty("success", out var successEl) || !successEl.GetBoolean())
                {
                    string msg = initRes.TryGetProperty("message", out var msgEl) ? msgEl.GetString() : "Init failed";
                    UpdateStatus("Handshake failed: " + msg, true);
                    return;
                }

                UpdateStatus("Authorizing license session...", false);
                var loginRes = await _authClient.LicenseLoginAsync(license);

                if (loginRes.TryGetProperty("success", out var okEl) && okEl.GetBoolean())
                {
                    string expiresStr = "Never";
                    if (loginRes.TryGetProperty("expires_at", out var expEl))
                        expiresStr = expEl.GetString();

                    _lblDashWelcome.Text = "Session Active (License Key)";
                    _lblDashRole.Text = "Access Role: Direct Key User";
                    _lblDashExpires.Text = "Subscription Expiration: " + expiresStr;
                    _lblDashHwid.Text = "HWID: " + _authClient.Hwid;

                    SwitchToView("dashboard");
                    UpdateStatus("Signed in via License Key.", false);
                }
                else
                {
                    string msg = loginRes.TryGetProperty("message", out var msgEl) ? msgEl.GetString() : "Login failed";
                    UpdateStatus("License Auth Failed: " + msg, true);
                }
            }
            catch (Exception ex)
            {
                UpdateStatus("Network error: " + ex.Message, true);
            }
            finally
            {
                _btnLicOnlyLogin.Enabled = true;
            }
        }

        private void HandleLogout()
        {
            _authClient = null;
            SwitchToView("login");
            UpdateStatus("Session terminated.", false);
        }

        // Sidebar Tab Switching UI
        private void SwitchToView(string viewName)
        {
            _viewLogin.Visible = (viewName == "login");
            _viewRegister.Visible = (viewName == "register");
            _viewLicenseOnly.Visible = (viewName == "license");
            _viewDashboard.Visible = (viewName == "dashboard");

            if (viewName == "login")
            {
                _activeIndicator.Location = new Point(5, _btnTabLogin.Location.Y + 3);
                _activeIndicator.Visible = true;
            }
            else if (viewName == "register")
            {
                _activeIndicator.Location = new Point(5, _btnTabRegister.Location.Y + 3);
                _activeIndicator.Visible = true;
            }
            else if (viewName == "license")
            {
                _activeIndicator.Location = new Point(5, _btnTabLicenseOnly.Location.Y + 3);
                _activeIndicator.Visible = true;
            }
            else
            {
                _activeIndicator.Visible = false;
            }
        }

        private void UpdateStatus(string text, bool isError)
        {
            _lblStatus.Text = text;
            _lblStatus.ForeColor = isError ? ColorRed : ColorTextMain;
        }

        // UI Creation Helpers
        private Button CreateSidebarButton(string text, int y)
        {
            var btn = new Button
            {
                Text = text,
                Location = new Point(15, y),
                Size = new Size(190, 36),
                FlatStyle = FlatStyle.Flat,
                ForeColor = ColorTextMuted,
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleLeft,
                Padding = new Padding(10, 0, 0, 0),
                Cursor = Cursors.Hand
            };
            btn.FlatAppearance.BorderSize = 0;
            btn.FlatAppearance.MouseOverBackColor = Color.FromArgb(30, 30, 42);
            btn.FlatAppearance.MouseDownBackColor = Color.FromArgb(40, 40, 55);

            btn.MouseEnter += (s, e) => btn.ForeColor = ColorTextMain;
            btn.MouseLeave += (s, e) => btn.ForeColor = ColorTextMuted;

            return btn;
        }

        private Panel CreateCardView(string title, string subtitle)
        {
            var card = new Panel
            {
                Size = new Size(this.Width - 220 - 60, this.Height - 40 - 50 - 60),
                Location = new Point(30, 30),
                BackColor = ColorCard
            };

            // Custom draw card background with a nice glowing border
            card.Paint += (s, e) =>
            {
                using (var pen = new Pen(ColorBorder, 1))
                {
                    e.Graphics.DrawRectangle(pen, 0, 0, card.Width - 1, card.Height - 1);
                }
            };

            var lblTitle = new Label
            {
                Text = title,
                Font = new Font("Segoe UI", 12F, FontStyle.Bold),
                ForeColor = ColorAccent,
                Location = new Point(35, 25),
                AutoSize = true
            };

            var lblSubtitle = new Label
            {
                Text = subtitle,
                Font = new Font("Segoe UI", 9F),
                ForeColor = ColorTextMuted,
                Location = new Point(35, 55),
                Size = new Size(card.Width - 70, 40)
            };

            card.Controls.Add(lblTitle);
            card.Controls.Add(lblSubtitle);

            return card;
        }

        protected override CreateParams CreateParams
        {
            get
            {
                const int CS_DROPSHADOW = 0x20000;
                CreateParams cp = base.CreateParams;
                cp.ClassStyle |= CS_DROPSHADOW; // Add native Windows dropshadow
                return cp;
            }
        }
    }

    /// <summary>
    /// A premium custom C# button control with hover transitions and modern border radii
    /// </summary>
    public class ModernButton : Button
    {
        private static readonly Color DefaultBg = Color.FromArgb(124, 77, 255);
        private static readonly Color DefaultHover = Color.FromArgb(101, 31, 255);

        public ModernButton(string text)
        {
            this.Text = text;
            this.FlatStyle = FlatStyle.Flat;
            this.BackColor = DefaultBg;
            this.ForeColor = Color.White;
            this.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            this.Cursor = Cursors.Hand;
            this.Size = new Size(120, 40);
            this.FlatAppearance.BorderSize = 0;
            this.DoubleBuffered = true;
        }

        protected override void OnMouseEnter(EventArgs e)
        {
            if (this.BackColor == DefaultBg)
                this.BackColor = DefaultHover;
            base.OnMouseEnter(e);
        }

        protected override void OnMouseLeave(EventArgs e)
        {
            if (this.BackColor == DefaultHover)
                this.BackColor = DefaultBg;
            base.OnMouseLeave(e);
        }
    }

    /// <summary>
    /// Custom TextBox Control with a placeholder label and beautiful bottom glow border styling.
    /// </summary>
    public class FlatTextBox : UserControl
    {
        private TextBox _innerBox;
        private string _placeholderText;
        private Label _lblPlaceholder;

        public string Text
        {
            get { return _innerBox.Text; }
            set
            {
                _innerBox.Text = value;
                _lblPlaceholder.Visible = string.IsNullOrEmpty(value);
            }
        }

        public bool UsePasswordChar
        {
            get { return _innerBox.UsePasswordChar; }
            set { _innerBox.UsePasswordChar = value; }
        }

        public FlatTextBox(string placeholder)
        {
            _placeholderText = placeholder;
            this.Size = new Size(200, 40);
            this.BackColor = Color.FromArgb(24, 24, 32);

            _innerBox = new TextBox
            {
                BorderStyle = BorderStyle.None,
                BackColor = Color.FromArgb(24, 24, 32),
                ForeColor = Color.FromArgb(245, 245, 250),
                Font = new Font("Segoe UI", 10F),
                Location = new Point(12, 11),
                Width = this.Width - 24,
                Multiline = false
            };

            _lblPlaceholder = new Label
            {
                Text = _placeholderText,
                ForeColor = Color.FromArgb(100, 100, 120),
                Font = new Font("Segoe UI", 9.5F, FontStyle.Italic),
                Location = new Point(10, 10),
                AutoSize = true,
                BackColor = Color.Transparent,
                Cursor = Cursors.IBeam
            };

            _lblPlaceholder.Click += (s, e) => _innerBox.Focus();

            _innerBox.TextChanged += (s, e) =>
            {
                _lblPlaceholder.Visible = string.IsNullOrEmpty(_innerBox.Text);
            };

            _innerBox.GotFocus += (s, e) =>
            {
                this.Invalidate(); // Trigger redrawing active border
            };

            _innerBox.LostFocus += (s, e) =>
            {
                this.Invalidate();
            };

            this.Controls.Add(_lblPlaceholder);
            this.Controls.Add(_innerBox);

            this.Paint += (s, e) =>
            {
                bool focused = _innerBox.Focused;
                Color borderClr = focused ? Color.FromArgb(124, 77, 255) : Color.FromArgb(50, 50, 70);
                using (var pen = new Pen(borderClr, 1))
                {
                    e.Graphics.DrawRectangle(pen, 0, 0, this.Width - 1, this.Height - 1);
                }
                if (focused)
                {
                    using (var brush = new SolidBrush(Color.FromArgb(20, 124, 77, 255)))
                    {
                        e.Graphics.FillRectangle(brush, 1, 1, this.Width - 2, this.Height - 2);
                    }
                }
            };
        }

        protected override void OnResize(EventArgs e)
        {
            if (_innerBox != null)
            {
                _innerBox.Width = this.Width - 24;
            }
            base.OnResize(e);
        }
    }
}
