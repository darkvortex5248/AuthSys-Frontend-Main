export default {
  loading: {
    buttons: true,
    commands: true,
    setCommands: true,
  },
  paths: {
    buttons: "buttons",
    commands: "commands",
  },
  logging: {
    buttonLoad: true,
    commandLoad: true,
    buttonUse: true,
    commandUse: true,
  },
  api: {
     baseUrl: (process.env.API_URL || "https://api.authsys.dpdns.org/api/v1/developer/sellers"),
    timeout: 5000,
  }
}