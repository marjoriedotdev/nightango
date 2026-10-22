/* MAIN MENU LOGIN */

class Chatango {
  constructor() {
    this.flags = {
      channel: {
        mention: {
          hex: "#ffcc00",
          value: 0
        },
        red: {
          hex: "#ed1c24",
          value: 256
        },
        orange: {
          hex: "#ee7f22",
          value: 512
        },
        green: {
          hex: "#39b54a",
          value: 1024
        },
        blue: {
          hex: "#25aae1",
          value: 2048
        },
        cyan: {
          hex: "#0e76bc",
          value: 4096
        },
        purple: {
          hex: "#662d91",
          value: 8192
        },
        pink: {
          hex: "#ed217c",
          value: 16384
        },
        no: {
          hex: "var(--theme-text-title)",
          value: 1
        },
        mod: {
          hex: "linear-gradient(-45deg, rgb(51, 51, 51) 20%, rgb(119, 119, 119) 20%, rgb(119, 119, 119) 40%, rgb(51, 51, 51) 40%, rgb(51, 51, 51) 60%, rgb(119, 119, 119) 60%, rgb(119, 119, 119) 80%, rgb(51, 51, 51) 80%)",
          value: 32768
        }
      },
      message: {
        [1 << 0]: "ANNOUNCEMENT", // UNUSED AND CANT MANUALLY SET, ONLY FOR GROUP ANNC
        [1 << 1]: "PREMIUM_ANNC", // UNUSED AND CANT MANUALLY SET, ONLY FOR GROUP ANNC
        3: "BG_ON_ANNC", // UNUSED AND CANT MANUALLY SET, ONLY FOR GROUP ANNC
        [1 << 2]: "PREMIUM",
        [1 << 3]: "BG_ON",
        [1 << 4]: "MEDIA_ON",
        [1 << 5]: "CENSORED",
        [1 << 6]: "MOD_ICON",
        [1 << 7]: "STAFF_ICON",
        [1 << 8]: "CHANNEL_RED", // 1
        [1 << 9]: "CHANNEL_ORANGE", // 2 - UNUSED
        [1 << 10]: "CHANNEL_GREEN", // 3 - UNUSED
        [1 << 11]: "CHANNEL_BLUE", // 4
        [1 << 12]: "CHANNEL_CYAN", // 5 - UNUSED
        [1 << 13]: "CHANNEL_PURPLE", // 6 - UNUSED
        [1 << 14]: "CHANNEL_PINK", // 7 - UNUSED
        [1 << 15]: "CHANNEL_MOD", // 8
        [1 << 16]: "ADMIN_ICON" // CAN NOT MANUALLY SET, ONLY FOR CLIENT
      },
      moderator: {
        [1 << 0]: "DELETED",
        [1 << 1]: "EDIT_MODS",
        [1 << 2]: "EDIT_MOD_VISIBILITY",
        [1 << 3]: "EDIT_BW",
        [1 << 4]: "EDIT_RESTRICTIONS",
        [1 << 5]: "EDIT_GROUP",
        [1 << 6]: "SEE_COUNTER",
        [1 << 7]: "SEE_MOD_CHANNEL",
        [1 << 8]: "SEE_MOD_ACTIONS",
        [1 << 9]: "EDIT_NLP",
        [1 << 10]: "EDIT_GP_ANNC",
        [1 << 11]: "EDIT_ADMINS", // DISPLAY OR HIDE BADGES MUST BE ON - allows removing of mods with edit_mods permission
        [1 << 12]: "EDIT_SUPERMODS", // DISPLAY OR HIDE BADGES MUST BE ON - the owner is considered a SUPERMOD, a moderator with this permission doesnt do anything if you try to remove the owner though
        [1 << 13]: "NO_SENDING_LIMITATIONS",
        [1 << 14]: "SEE_IPS",
        [1 << 15]: "CLOSE_GROUP",
        [1 << 16]: "CAN_BROADCAST",
        [1 << 17]: "MOD_ICON_VISIBLE", // DISPLAY OR HIDE BADGES MUST BE ON
        [1 << 18]: "IS_STAFF",
        [1 << 19]: "STAFF_ICON_VISIBLE", // DISPLAY OR HIDE BADGES MUST BE ON
        [1 << 20]: "UNBAN_ALL"
      },
      coOwner: [ // allows removal of admins with the permission to edit mods (admin + "EDIT_ADMINS")
        "EDIT_MODS",
        "SEE_MOD_CHANNEL",
        "SEE_MOD_ACTIONS",
        "SEE_COUNTER",
        "EDIT_MOD_VISIBILITY",
        "EDIT_BW",
        "EDIT_RESTRICTIONS",
        "EDIT_GROUP",
        "EDIT_NLP",
        "EDIT_GP_ANNC",
        "EDIT_ADMINS",
        "NO_SENDING_LIMITATIONS",
        "SEE_IPS",
        "CAN_BROADCAST",
        "IS_STAFF",
        "UNBAN_ALL"
      ],
      defaultModerator: [
        "SEE_MOD_CHANNEL",
        "SEE_MOD_ACTIONS",
        "SEE_COUNTER",
        "SEE_IPS",
        "CAN_BROADCAST"
      ],
      possibleModerator: [
        "SEE_MOD_CHANNEL",
        "SEE_MOD_ACTIONS",
        "SEE_COUNTER",
        "EDIT_BW",
        "EDIT_NLP",
        "NO_SENDING_LIMITATIONS",
        "SEE_IPS",
        "UNBAN_ALL"
      ],
      administrator: [
        "SEE_MOD_CHANNEL",
        "SEE_MOD_ACTIONS",
        "SEE_COUNTER",
        "EDIT_MOD_VISIBILITY",
        "EDIT_BW",
        "EDIT_RESTRICTIONS",
        "EDIT_GROUP",
        "EDIT_NLP",
        "EDIT_GP_ANNC",
        "NO_SENDING_LIMITATIONS",
        "SEE_IPS",
        "CAN_BROADCAST",
        "IS_STAFF",
        "UNBAN_ALL"
      ],
      onlyAdministrator: [
        "EDIT_MODS",
        "EDIT_RESTRICTIONS",
        "EDIT_MOD_VISIBILITY",
        "EDIT_GROUP",
        "EDIT_GP_ANNC",
        "CLOSE_GROUP"
      ],
      group: {
        [1 << 0]: "LIST_TAXONOMY",
        [1 << 1]: "UNKNOWN", // UNUSED
        [1 << 2]: "NOANONS",
        [1 << 3]: "NOFLAGGING",
        [1 << 4]: "NOCOUNTER",
        [1 << 5]: "NOIMAGES",
        [1 << 6]: "NOLINKS",
        [1 << 7]: "NOVIDEOS",
        [1 << 8]: "NOSTYLEDTEXT", // UNUSED WITHOUT MODIFICATION (disable text styles for all users)
        [1 << 9]: "NOLINKSCHATANGO", // chatango blocked links?
        [1 << 10]: "NOBRDCASTMSGWITHBW",
        [1 << 11]: "RATELIMITREGIMEON",
        [1 << 12]: "UNKNOWN2", // USED BUT I DONT KNOW???
        [1 << 13]: "CHANNELSDISABLED",
        [1 << 14]: "NLP_SINGLEMSG",
        [1 << 15]: "NLP_MSGQUEUE",
        [1 << 16]: "BROADCAST_MODE",
        [1 << 17]: "CLOSED_IF_NO_MODS",
        [1 << 18]: "IS_CLOSED",
        [1 << 19]: "SHOW_MOD_ICONS",
        [1 << 20]: "MODS_CHOOSE_VISIBILITY",
        [1 << 21]: "NLP_NGRAM",
        [1 << 22]: "NO_PROXIES",
        [1 << 23]: "HIGH_N", // if "high traffic" - show_advert
        [1 << 24]: "UNKNOWN3", // UNUSED
        [1 << 25]: "UNKNOWN4", // UNUSED
        [1 << 26]: "UNKNOWN5", // UNUSED
        [1 << 27]: "UNKNOWN6", // UNUSED
        [1 << 28]: "HAS_XML",
        [1 << 29]: "UNSAFE"
      },
      purchase: {
        [1 << 0]: "Account does not exist.",
        [1 << 1]: "Account is a group.",
        [1 << 2]: "Account is an inappropriate word.",
        [1 << 3]: "Account contains an inappropriate word.",
        [1 << 4]: "Account is not expired.",
        [1 << 5]: "Account is currently being purchased.",
        [1 << 6]: "Account is the owner of an active group."
      },
      weight: [["5", 75], ["6", 75], ["7", 75], ["8", 75], ["16", 75], ["17", 75], ["18", 75], ["9", 95], ["11", 95], ["12", 95], ["13", 95], ["14", 95], ["15", 95], ["19", 110], ["23", 110], ["24", 110], ["25", 110], ["26", 110], ["28", 104], ["29", 104], ["30", 104], ["31", 104], ["32", 104], ["33", 104], ["35", 101], ["36", 101], ["37", 101], ["38", 101], ["39", 101], ["40", 101], ["41", 101], ["42", 101], ["43", 101], ["44", 101], ["45", 101], ["46", 101], ["47", 101], ["48", 101], ["49", 101], ["50", 101], ["52", 110], ["53", 110], ["55", 110], ["57", 110], ["58", 110], ["59", 110], ["60", 110], ["61", 110], ["62", 110], ["63", 110], ["64", 110], ["65", 110], ["66", 110], ["68", 95], ["71", 116], ["72", 116], ["73", 116], ["74", 116], ["75", 116], ["76", 116], ["77", 116], ["78", 116], ["79", 116], ["80", 116], ["81", 116], ["82", 116], ["83", 116], ["84", 116]]
    }

    this.fonts = {
      face: {
        0: "arial",
        1: "comic",
        2: "georgia",
        3: "handwriting",
        4: "impact",
        5: "palatino",
        6: "papyrus",
        7: "times",
        8: "typewriter"
      },
      family: {
        0: "sans-serif",
        1: '"Comic Sans", "Comic Sans MS", cursive',
        2: "Georgia, serif",
        3: '"Lucida Handwriting", Zapfino, Chalkduster, sans-serif',
        4: "Impact, sans-serif",
        5: "Palatino, serif",
        6: "Papyrus, cursive",
        7: "Times, serif",
        8: 'Typewriter, "Courier New", monospace'
      }
    }

    this.subdomain = {
      v: x => `https://m1.chatango.com/av/${x[0]}/${x[1] || x[0]}/${x}/v.flv`.toLowerCase(),
      t: x => `https://m1.chatango.com/av/${x[0]}/${x[1] || x[0]}/${x}/t.jpg`.toLowerCase(),
      msgstyles: x => `https://ust.chatango.com/profileimg/${x[0]}/${x[1] || x[0]}/${x}/msgstyles.json`.toLowerCase(),
      mod1: x => `https://ust.chatango.com/profileimg/${x.match(/^(_|-)/) ? "sp/sp" + x: `${x[0]}/${x[1] || x[0]}/${x}`}/mod1.xml`.toLowerCase(),
      mod2: x => `https://ust.chatango.com/profileimg/${x[0]}/${x[1] || x[0]}/${x}/mod2.xml`.toLowerCase(),
      custom_profile: x => `https://ust.chatango.com/profileimg/${x[0]}/${x[1] || x[0]}/${x}/custom_profile.css`.toLowerCase(),
      full: x => `https://ust.chatango.com/profileimg/${x.match(/^(_|-)/) ? "sp/sp" + x: `${x[0]}/${x[1] || x[0]}/${x}`}/full.jpg`.toLowerCase(),
      thumb: x => `https://ust.chatango.com/profileimg/${x.match(/^(_|-)/) ? "sp/sp" + x: `${x[0]}/${x[1] || x[0]}/${x}`}/thumb.jpg`.toLowerCase(),
      thumb_m: x => `https://ust.chatango.com/profileimg/${x.match(/^(_|-)/) ? "sp/sp" + x: `${x[0]}/${x[1] || x[0]}/${x}`}/thumb_m.jpg`.toLowerCase(),
      msgbg: (x, y) => `https://ust.chatango.com/profileimg/${x[0]}/${x[1] || x[0]}/${x}/msgbg.${y}`.toLowerCase(),
      gprofile: x => `https://ust.chatango.com/groupinfo/${x.match(/^(_|-)/) ? "sp/sp" + x: `${x[0]}/${x[1] || x[0]}/${x}`}/gprofile.xml`.toLowerCase(),
      t_: (x, y) => `https://ust.chatango.com/um/${x[0]}/${x[1] || x[0]}/${x}/img/t_${y}.jpg`.toLowerCase(),
      l_: (x, y) => `https://ust.chatango.com/um/${x[0]}/${x[1] || x[0]}/${x}/img/l_${y}.jpg`.toLowerCase(),
      noimage: "https://ust.chatango.com/profileimg/noimage.jpg"
    }

    this.link = x => `https://${punycode.toASCII(x)}.chatango.com`

    this.path = (x, y) => `https://${y ? y + ".": ""}chatango.com/${x}`

    this.emojis = {}

    this.badges = {
      SYSTEM_ICON: {
        icon: "fa-solid fa-server",
        label: "System"
      },
      CLIENT_ICON: {
        icon: "fa-solid fa-eye",
        label: "Only you can see this"
      },
      ANNC_ICON: {
        icon: "fa-solid fa-bullhorn",
        label: "Announcement"
      },
      MEDIA_ICON: {
        icon: "fa-solid fa-play",
        label: "Play media"
      },
      VERIFIED_BOT_ICON: {
        icon: "fa-solid fa-robot",
        label: "Verified bot"
      },
      BOT_ICON: {
        icon: "fa-solid fa-robot",
        label: "Bot"
      },
      GUEST_ICON: {
        icon: "fa-solid fa-user-secret",
        label: "Guest"
      },
      MOD_ICON: {
        icon: "fa-solid fa-shield",
        label: "Moderator"
      },
      STAFF_ICON: {
        icon: "fa-duotone fa-shield-halved",
        label: "Administrator"
      },
      ADMIN_ICON: {
        icon: "fa-duotone fa-shield-quartered",
        label: "Co-owner"
      },
      OWNER_ICON: {
        icon: "fa-solid fa-crown",
        label: "Owner"
      },
      CHATANGO_ICON: {
        icon: "fa-solid fa-wrench",
        label: "Chatango staff"
      },
      EDIT_ICON: {
        icon: "fa-solid fa-pen",
        label: "Edited"
      },
      UNREAD_ICON: {
        icon: "fa-solid fa-envelope",
        label: "Unread"
      }
    }

    this.regex = {
      card: {
        cc_visa: "^4[0-9]{12}(?:[0-9]{3})?$",
        cc_mastercard: "^5[1-5][0-9]{14}$",
        cc_amex: "^3[47][0-9]{13}$",
        cc_discover: "^6(?:011|5[0-9]{2})[0-9]{12}$",
        pcc_visa: "^4[0-9]{0,16}$",
        pcc_mastercard: "^5$|^5[1-5][0-9]{0,14}$",
        pcc_amex: "^3$|^3[47][0-9]{0,13}$",
        pcc_discover: "^6$|^60$|^601$|^6(?:011|5[0-9]{0,2})[0-9]{0,12}$"
      }
    }

    this.server = {
      time: 0
    }

    this.error = {
      creategroup: {
        nohandle: "A group name is required.",
        longhandle: "The group name is too long.",
        badcharhandle: "The group name contains invalid characters.",
        longtitle: "The group title is too long.",
        longdescription: "The group description is too long.",
        badnamepart: "The group name contains inappropriate parts.",
        groupexists: "The group name is taken.",
        sellerexists: "The group name is an account.",
        invalid_token: "Relogin required.",
        invalid_query: "Missing parameters.",
        user_does_not_match: "Relogin required!",
        no_authType: "Missing authType parameter"
      }
    }

    this.staff = ["chatango", "alec", "claire", "mila", "josh"]
  }

  shorthand(data) {
    var short = (data.length == 1 ? (data + "/").repeat(3): data[0] + "/" + data[1] + "/" + data + "/").toLowerCase().slice(0, -1)
    var special = short.startsWith("-") || short.startsWith("_")
    if (special) {
      short = "sp/sp" + short.split("/")[2]
    }
    return short
  }

  getAvatar(data) {
    var target = data.toLowerCase()
    var avatar = ["full", "thumb_m", "thumb"]
    if (target in client.cache.background) {
      if (+client.cache.background[target].useimg) {
        avatar.push("msgbg")
      }
    }
    var images = avatar.map(x => chatango.subdomain[x](data, "jpg"))
    var source = images.slice()
    if (target in client.cache.profile) {
      if (client.cache.profile[target].custom["background-image"]) {
        images.push(client.cache.profile[target].custom["background-image"])
        source.push(client.cache.profile[target].custom["background-image-source"])
      }
    }
    return {images: images, source: source}
  }

  getTime() {
    if (client.private && client.private.socket.readyState == client.private.socket.OPEN) {
      client.socket("private_message", "time.time", "Could not retrieve server time.")
    }
  }

  getServer(data) {
    try {
      var weights = this.flags.weight.map(x => x[1])
      var target = data.replace(/[-_]/g, "q")
      var length = Math.max(1000, parseInt(target.substring(6, 9) || 0, 36))
      var [position, total, serve] = [(parseInt(target.substring(0, 5), 36) % length) / length, weights.reduce(function(a, b) {return a + b}), 0]
      for (var x = 0; x < this.flags.weight.length; x++) {
        serve += parseFloat(this.flags.weight[x][1] / total)
        if (position <= serve) {return `wss://s${this.flags.weight[x][0]}.chatango.com:8081/`}
      }
    } catch(error) {
      console.log(error)
      return "wss://s12.chatango.com:8081/"
    }
  }

  getAnon(session, timestamp) {
    var last = session.substr(4, 4)
    var convert = timestamp.toString().split(".")[0].substr(-4)
    var identifier = ""
    var arrange = 0
    for (var x = 0; x < last.length; x++) {
      var start = +last[x]
      var stop = +convert[x]
      arrange = String(start + stop)
      identifier += arrange.substr(-1)
    }
    return "!anon" + identifier
  }

  setBackground(target, premium) {
    var background = document.querySelector('[data-preload="background"]')
    var bgc = premium.bgc && premium.bgc.length ? "#" + premium.bgc: "#000000"
    if (bgc) {
      background.querySelector('[data-color="bgColor"]').value = bgc
      background.querySelector('[data-color-input="bgColor"]').value = bgc
      background.querySelector('[data-color-input="bgColor"]').style.color = bgc
    }
    background.querySelector('[name="bgalp"]').value = premium.bgalp
    background.querySelector('[data-name="bgalp"]').firstElementChild.value = premium.bgalp
    background.querySelector('[data-name="bgalp"]').querySelectorAll("input").forEach(x => {
      x.value = premium.bgalp
      x.onchange = y => {
        background.querySelector(".background-item-preview").style.color = hexToRgb(background.querySelector('[data-color="bgColor"]').value, y.currentTarget.value)
      }
    })
    background.querySelector('[data-button="upload"]').onclick = () => {
      background.querySelector(".background-item-upload").click()
    }
    background.querySelector('[data-button="remove"]').onclick = async () => {
      background.querySelectorAll(".filter-button").forEach(x => {
        x.disabled = true
      })
      var form = new FormData()
      var noimage = await fetch(`${torch.static}/img/noimage.jpg`)
      var blob = await noimage.blob()
      var file = new File([blob], "noimage.jpg", {type: blob.type})
      form.set("Filedata", file)
      client.post(chatango.path("updatemsgbg"), form, {
        progress: true,
        credential: "lo"
      }).then(async response => {
        console.log(response)
        if (response == "saved") {
          client.groups[client.focus].socket.send("miu\r\n")
          client.setNotice({icon: "check", color: "var(--theme-active)", content: "Background image successfully removed.", button: "Thanks"})
          background.querySelector('[name="useimg"]').checked = false
        }
        background.querySelectorAll(".filter-button").forEach(x => {
          x.removeAttribute("disabled")
        })
      }).catch(error => {
        console.log(error)
        client.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: "An error occurred.", button: "Retry", action: () => background.querySelector('[data-button="remove"]').click()})
        background.querySelectorAll(".filter-button").forEach(x => {
          x.removeAttribute("disabled")
        })
      })
    }
    background.querySelector('[name="tile"]').checked = Boolean(+premium.tile)
    background.querySelector('[name="useimg"]').checked = Boolean(+premium.useimg)
    if (premium.useimg == 1) {
      background.querySelector(".background-item-preview").style.backgroundColor = hexToRgb(premium.bgc, premium.bgalp)
      var bgimg = document.createElement("img")
      bgimg.src = chatango.subdomain.msgbg(target, "jpg")
      bgimg.style.width = "100%"
      bgimg.style.opacity = premium.ialp / 100
      background.querySelector(".background-item-preview").replaceChildren(bgimg)
    }
    background.querySelector('[data-name="ialp"]').querySelectorAll("input").forEach(x => {
      x.value = premium.ialp
      x.onchange = y => {
        background.querySelector(".background-item-preview").firstElementChild.style.opacity = y.currentTarget.value / 100
      }
    })
    background.querySelector(`[data-align="${premium.align}"]`).classList.add("background-alignment-select")

  }

  getBackground(data) {
    var alignment = {tr: "top right", br: "bottom right", tl: "top left", bl: "bottom left"}
    var target = data.username.toLowerCase()
    if (client.cache.wait.premium.indexOf(target) >= 0) {
      var queue = target in client.cache.queue.premium
      if (!queue) {
        client.cache.queue.premium[target] = [data]
      } else {
        client.cache.queue.premium[target].push(data)
      }
    } else if (target in client.cache.background && !data.reload) {
      var remain = Object.keys(client.cache.background[target]).length
      if (remain && data.node) {
        if (client.cache.background[target].bgalp == 0) {
          data.node.style.backgroundColor = "rgb(255, 255, 255)"
          data.node.querySelector(".chat-message-timestamp").style.color = "rgb(255, 255, 255)"
        } else {
          data.node.style.backgroundColor = hexToRgb(client.cache.background[target].bgc, client.cache.background[target].bgalp)
          data.node.querySelector(".chat-message-timestamp").style.color = hexToRgb(client.cache.background[target].bgc, false)
        }
        if (client.cache.background[target].useimg == 1 && client.settings.appearance.messages.show_bg_img) {
          data.node.querySelector(".chat-message-background").style.backgroundImage = `url(${chatango.subdomain.msgbg(target, "jpg") + (client.cache.background[target].url || "")})`
          data.node.querySelector(".chat-message-background").style.backgroundPosition = alignment[client.cache.background[target].align]
          data.node.querySelector(".chat-message-background").style.opacity = client.cache.background[target].ialp + "%"
          if (client.cache.background[target].tile == 0) {
            data.node.querySelector(".chat-message-background").style.backgroundRepeat = "no-repeat"
          }
        }
      } else {
        return client.cache.background[target]
      }
    } else {
      client.cache.wait.premium.push(target)
      fetch(chatango.subdomain.msgbg(target, "xml")).then(async response => {
        if (response.headers.get("content-type") == "text/xml") {
          var content = await response.text()
          var msgbg = new DOMParser()
          var information = msgbg.parseFromString(content, "text/xml")
          var bgi = information.firstChild.attributes
          var premium = {}
          for (let x = 0; x < bgi.length; x++) {
            premium[bgi[x].name] = bgi[x].value
          }
          client.cache.background[target] = premium
          if (data.node == data.username) {
            chatango.setBackground(target, premium)
          } else if (data.node) {
            document.querySelectorAll(`[data-user="${target}"]`).forEach(x => {
              if (premium.bgalp == 0) {
                data.node.style.backgroundColor = "rgb(255, 255, 255)"
                data.node.querySelector(".chat-message-timestamp").style.color = "rgb(255, 255, 255)"
              } else {
                data.node.style.backgroundColor = hexToRgb(premium.bgc, premium.bgalp)
                data.node.querySelector(".chat-message-timestamp").style.color = hexToRgb(premium.bgc, false)
              }
              if (premium.useimg == 1 && client.settings.appearance.messages.show_bg_img) {
                data.node.querySelector(".chat-message-background").style.backgroundImage = `url(${chatango.subdomain.msgbg(target, "jpg") + (client.cache.background[target].url || "")})`
                data.node.querySelector(".chat-message-background").style.backgroundPosition = alignment[premium.align]
                data.node.querySelector(".chat-message-background").style.opacity = premium.ialp + "%"
                if (premium.tile == 0) {
                  data.node.querySelector(".chat-message-background").style.backgroundRepeat = "no-repeat"
                }
              }
            })
          } else if (data.reload) {
            if (client.user.name.toLowerCase() == target) chatango.setBackground(target, premium)
            var now = +new Date
            document.querySelectorAll(`.chat-message[data-user=${target}]`).forEach(x => {
              if (premium.bgalp == 0) {
                x.style.backgroundColor = "rgb(255, 255, 255)"
                x.querySelector(".chat-message-timestamp").style.color = "rgb(255, 255, 255)"
              } else {
                x.style.backgroundColor = hexToRgb(premium.bgc, premium.bgalp)
                x.querySelector(".chat-message-timestamp").style.color = hexToRgb(premium.bgc, false)
              }
              if (premium.useimg == 1 && client.settings.appearance.messages.show_bg_img) {
                client.cache.background[target].url = "?" + now
                x.querySelector(".chat-message-background").style.backgroundImage = `url(${chatango.subdomain.msgbg(target, "jpg") + "?" + now})`
                x.querySelector(".chat-message-background").style.backgroundPosition = alignment[premium.align]
                x.querySelector(".chat-message-background").style.opacity = premium.ialp + "%"
                if (premium.tile == 0) {
                  x.querySelector(".chat-message-background").style.backgroundRepeat = "no-repeat"
                }
              }
            })
          } else {
            return premium
          }
          client.cache.wait.premium = client.cache.wait.premium.filter(x => x != target)
          if (target in client.cache.queue.premium) {
            Object.values(client.cache.queue.premium[target]).forEach(x => {
              chatango.getBackground(x)
            })
            delete client.cache.queue.premium[target]
          }
        } else {
          client.cache.background[target] = {}
          client.cache.wait.premium = client.cache.wait.premium.filter(x => x != target)
          if (target in client.cache.queue.premium) {
            delete client.cache.queue.premium[target]
          }
        }
      })
    }
  }

  renderStripes(data) {
    var team = data.match(/\?([#0-9a-z,]+)(?::(\d+):?(\d+)?)?/i)
    var face = document.querySelector('[data-preload="emojis"]').querySelector(`.emoji-item-stripes`)
    var clone = face.cloneNode(true)
    if (!team) {
      team = [false, "#ff0000"]
    }
    if (team[1] == "random") {
      var amount = Math.ceil(Math.round(5 * Math.random())) + 1
      var color = []
      for (var x = 0; x < amount; x++) {
        color.push(`#${Math.floor(16777215 * Math.random()).toString(16)}`)
      }
      var rotation = Math.round(360 * Math.random())
      var thickness = Math.ceil(Math.round(10 * Math.random()))
    } else {
      var color = team[1].split(",")
      var rotation = team[2] ? Math.min(Math.abs(team[2]), 360): 0
      var thickness = team[3] ? Math.min(Math.abs(Math.round(team[3])), 10): 1
    }
    var begin = 100 / thickness / color.length
    var svg = document.createElement("pattern")
    svg.id = "emojiItemStripes"
    svg.setAttribute("patternTransform", `rotate(${rotation})`)
    svg.setAttribute("patternUnits", "userSpaceOnUse")
    svg.setAttribute("width", 100)
    svg.setAttribute("height", begin * color.length)
    color.forEach((y, z) => {
      var rect = document.createElement("rect")
      rect.setAttribute("y", z * begin)
      rect.setAttribute("width", 100)
      rect.setAttribute("height", begin)
      rect.setAttribute("fill", y)
      svg.appendChild(rect)
    })
    clone.querySelector("pattern").replaceWith(svg)
    clone.querySelectorAll("[id]").forEach(x => {
      var previous = x.getAttribute("id")
      var identifier = `e${Math.floor(Math.random() * 1E16)}`
      x.setAttribute("id", identifier)
      var overwrite = x.parentNode.parentNode.querySelector(`[fill="url(#${previous})"]`) || x.parentNode.parentNode.querySelector(`[stroke="url(#${previous})"]`)
      overwrite.setAttribute("fill", `url(#${identifier})`)
    })
    return clone
  }

  parseMini(data, color) {
    var target = decodeURIComponent(data).replaceAll(/(\r\n[ ]+<br>)/gi, "").replaceAll("\r\n", "\r").replaceAll("\r", "<br>").replaceAll("\n", "<br>")
    target = target.replace(/<span.*?>/gi, "").replace(/<\/span>/gi, "")
    target = target.replace(/<\/font>/gi, "</span>").replace(/<center.*?>/gi, '<p align="center">').replace(/<\/center>/gi, "</p>")
    target = target.replace(/<div style="text-align: (left|right|center|justify)">/gi, '<p align="$1">')
    //target = target.replace(/(?![^<]*>)(https?.*?[^\s<]+|www\..*?[^\s<]+)/g, '<a href="$1" target="_blank" onclick="client.externalWarning({url: this.href}); return false">$1</a>')
    target = target.replace(/<font(?=(?:.*?( size="\d+"))?)(?=(?:.*?( color="#?[A-Za-z0-9]\w+"))?)(?=(?:.*?( face="[\w ]+"))?).*?>/gi, (x, size, color, face) => {
      var strip = ""
      x.includes(size) ? strip += size: null
      x.includes(color) ? strip += color: null
      x.includes(face) ? strip += face: null
      return `<font${strip}>`
    })
    target = target.replace(/face(?: ?)=(?: ?)"([\w\s]+)"/gi, x => {
      var face = x.match(/face(?: ?)=(?: ?)"([\w\s]+)"/)
      if (face) {
        var font = face[1].replaceAll(" ", "-").toLowerCase()
        var exist = document.head.querySelector(`[data-font="${font}"]`)
        if (!Object.values(chatango.fonts.face).includes(font) && !exist) {
          var style = document.createElement("link")
          style.href = `https://fonts.cdnfonts.com/css/${font}`
          style.rel = "stylesheet"
          style.setAttribute("data-font", font)
          style.setAttribute("referrerpolicy", "no-referrer")
          style.onerror = () => {}
          document.head.appendChild(style)
        }
        return `font-family: ${face[1]};`
      } else {
        return "sans-serif"
      }
    })
    target = target.replace(/color(?: ?)=(?: ?)"((#?)[A-Za-z0-9]\w+)"/gi, "color: $1;")
    target = target.replace(/font-size:(?: ?)clamp\(\d+px, (\d+)px, \d+px\);/gi, 'size="$1"')
    target = target.replace(/size(?: ?)=(?: ?)"(\d+)"/gi, "font-size: clamp(10px, $1px, 30px);")
    target = target.replace(/<font (.*?)>/gi, '<span style="$1">')
    target = target.replace(/<span(?:.*?( style=".*?"))?.*?>/gi, "<span$1>")
    target = target.replace(/<div(.*?)>/gi, "")
    target = target.replace(/<\/div>/gi, "")
    target = target.replace(/<br(.*?)>/gi, "<br>")
    target = target.replace(/<p(?:.*?( align="\w+"))?.*?>/gi, "<p$1>")
    target = target.replace(/<p align="(left|right|center|justify)">/gi, '<p style="text-align: $1">').replaceAll(/<!-(.*?)->/g, "").replace(/<\/p.*?>/gi, "</p>").replaceAll(/  (?![^<]*>)/g, " &nbsp;")
    target = target.replace(/<style.*?>.*?<\/style>/g, "").replace(/<script.*?>.*?<\/script>/g, "")
    var whitelist = ["b", "i", "u", "a", "p", "span", "br", "img"]
    var closing = ["b", "i", "u", "a", "p", "span"]
    Array.from(target.matchAll(/on(\w+)=("(.*?)"|'(.*?)')/gi), x => {
      target = target.replace(x, "")
    })
    Array.from(target.matchAll(/<(\w+)(.*?)>/gi), x => {
      var tag = x[1].toLowerCase()
      if (tag == "a") {
        var link = x[2].match(/href="?(https?.*?[^>"%]+|www\..*?[^>"%]+)/i)
        var image = x[2].match(/href="?(https?.*?(?:png|apng|jpg|gif|jpeg|bmp|webp)[^>"%]*)/i)
        if (image) {
          if (color) {
            target = target.replace(x[0], `<a href="${image[1]}" target="_blank" onclick="this.firstElementChild && this.firstElementChild.src && this.href == this.firstElementChild.alt ? client.externalWarning({url: this.firstElementChild.src, urls: [this.firstElementChild.src], source: [this.href], type: 'image'}): client.externalWarning({url: this.href}); return false">`)
          } else {
            target = target.replace(x[0], `<a href="${image[1]}" target="_blank" onclick="this.firstElementChild && this.firstElementChild.src && this.href == this.firstElementChild.alt ? client.externalWarning({url: this.firstElementChild.src, urls: [this.firstElementChild.src], source: [this.href], type: 'image'}): client.externalWarning({url: this.href}); return false">`)
          }
        } else if (link) {
          if (color) {
            target = target.replace(x[0], `<a href="${link[1]}" target="_blank" style="color: ${color};" onclick="client.externalWarning({url: this.href}); return false">`)
          } else {
            target = target.replace(x[0], `<a href="${link[1]}" target="_blank" onclick="client.externalWarning({url: this.href}); return false">`)
          }
        } else {
          target = target.replace(x[0], "")
        }
      } else if (tag == "img") {
        var link = x[2].match(/src="?(https?.*?(?:png|apng|jpg|gif|jpeg|bmp|webp)[^>"%]*)/i)
        if (link) {
          var change = chatango.crawl(link[1], false, "image", false, false, true)
          target = target.replace(x[0], change)
        } else {
          target = target.replace(x[0], "")
        }
      } else if (whitelist.indexOf(tag) < 0) {
        target = target.replace(x[0], "")
      } else if (x[2].length == 1) {
        target = target.replace(x[1] + x[2], x[1])
      }
    })
    Array.from(target.matchAll(/<\/(\w+).*?>/gi), x => {
      var tag = x[1].toLowerCase()
      if (closing.indexOf(tag) < 0) {
        target = target.replace(x, "")
      } else {
        target = target.replace(x, `</${tag}>`)
      }
    })
    return target
  }

  applyMini(profile, target, data) {
    var avatars = chatango.getAvatar(target)
    var container = document.createElement("div")
    container.className = "application-profile-container"
    container.setAttribute("data-user", target)
    if (data.sidebar) {
      container.setAttribute("data-target", target)
    }
    var member = document.createElement("div")
    member.className = "application-profile-member"
    if (profile.premium.data) {
      if (profile.premium.data.textContent * 1000 - Date.now() > 0) {
        profile.premium.active = true
        member.style.color = profile.custom.color
        if (profile.custom["background-image"]) {
          member.style.background = `${profile.custom["background-color"]} url(${profile.custom["background-image"]}) ${profile.custom["background-repeat"]} left 0 / contain`
        } else {
          member.style.backgroundColor = profile.custom["background-color"]
        }
      } else {
        profile.premium.active = false
      }
    }
    var side = document.createElement("div")
    side.className = "application-profile-side"
    var quality = parseInt(client.settings.appearance.messages.quality_avatar)
    var low = [1, 2].indexOf(quality) >= 0
    var avatar = document.createElement("img")
    avatar.className = "chat-message-avatar"
    avatar.src = target == "client" ? `${torch.static}/img/client.png`: low ? avatars.images[2]: avatars.images[1]
    avatar.alt = `${target} profile picture`
    avatar.loading = "lazy"
    var pixel = [2, 4].indexOf(quality) >= 0
    if (pixel) {
      avatar.style.imageRendering = "pixelated"
    }
    avatar.onclick = () => {
      if (client.user.name == target && data.avatar) {
        client.externalWarning({url: chatango.link(target), type: "avatar"})
      } else if (client.private && data.sidebar) {
        client.socket("private_message", `connect:${target}`, "An ewwow occuwwed awa")
      } else {
        client.externalWarning({close: true, type: "profile"})
        client.externalWarning({url: avatars.images[0], urls: avatars.images, source: avatars.source, type: "image"})
      }
    }
    side.appendChild(avatar)
    var option = document.createElement("button")
    option.className = "application-profile-option"
    option.textContent = "More"
    option.onclick = x => {
      var modal = document.querySelector(".external-modal").open
      var position = x.currentTarget.getBoundingClientRect()
      var action = ["avatar"]
      var overrule = {content: {username: target}, height: true, event: x, toggle: true, level: modal}
      modal ? overrule.overtop = position.y - 270: overrule.top = 30
      modal ? overrule.left = position.x - 55: overrule.left = -50
      if (client.user.name == target) {
        action.push("user_status", "user_settings", "user_switch", "user_logout")
      } else {
        if (client.private) {
          var friend = client.private.friends.includes(target) ? "unfriend": "friend"
          var listen = client.cache.listen.includes(target) ? "unlisten": "listen"
          var blocked = client.private.blocked.includes(target) ? "unblock": "block"
          var ignored = client.settings.safety.users.ignore.includes(target) ? "unignore": "ignore"
          if (data.sidebar) {
            action.push("who", "profile")
          }
          action.push(friend, "message", listen, blocked, ignored)
          if (data.role && ["read", "unread"].includes(data.role)) action.push("close")
        }
      }
      overrule.action = action
      client.setContext(x.currentTarget, overrule)
    }
    side.appendChild(option)
    if (target == "cheese") { // TODO: torch client profile featured badge test
      var badge = document.createElement("div")
      badge.className = "application-profile-badge"
      badge.setAttribute("data-badge", "Client developer")
      var icon = document.createElement("span")
      icon.className = "application-profile-icon fa-solid fa-fire"
      icon.style.color = "var(--theme-highlight)"
      badge.appendChild(icon)
      side.appendChild(badge)
     } else if (client.cache.bots.verified.includes(target)) {
      var badge = document.createElement("div")
      badge.className = "application-profile-badge"
      badge.setAttribute("data-badge", "Verified bot")
      var icon = document.createElement("span")
      icon.className = "application-profile-icon fa-solid fa-robot"
      icon.style.color = "var(--theme-active)"
      badge.appendChild(icon)
      side.appendChild(badge)
    } else if (client.cache.contributors.includes(target)) {
      var badge = document.createElement("div")
      badge.className = "application-profile-badge"
      badge.setAttribute("data-badge", "Contributor")
      var icon = document.createElement("span")
      icon.className = "application-profile-icon fa-solid fa-star"
      icon.style.color = "var(--brand-ko-fi)"
      badge.appendChild(icon)
      side.appendChild(badge)
    } else if (this.staff.includes(target)) {
      var badge = document.createElement("div")
      badge.className = "application-profile-badge"
      badge.setAttribute("data-badge", "Chatango staff")
      var icon = document.createElement("span")
      icon.className = "application-profile-icon fa-solid fa-wrench"
      icon.style.color = "var(--brand-chatango)"
      badge.appendChild(icon)
      side.appendChild(badge)
    } else if (profile.locked) {
      var reason = profile.locked.innerHTML.split(" ")[1]
      var badge = document.createElement("div")
      badge.className = "application-profile-badge"
      badge.setAttribute("data-badge", `Locked by Chatango for ${reason}`)
      var icon = document.createElement("span")
      icon.className = "application-profile-icon fa-solid fa-lock"
      icon.style.color = "var(--brand-chatango)"
      badge.appendChild(icon)
      side.appendChild(badge)
    }
    member.appendChild(side)
    var detail = document.createElement("div")
    detail.className = "application-profile-detail"
    var user = document.createElement("span")
    user.className = "application-profile-data"
    if (profile.premium.active && profile.custom.color) {
      user.style.color = profile.custom.color
    }
    if (profile.premium.active) {
      var vr = document.createElement("div")
      vr.className = `application-profile-vr fa-solid fa-play`
      vr.onclick = () => {
        client.externalWarning({close: true, type: "profile"})
        client.externalWarning({url: chatango.link(target), username: target, type: "vr"})
      }
      user.appendChild(vr)
    }
    var username = document.createElement("span")
    username.className = "application-profile-item"
    username.textContent = target[0].toUpperCase() + target.slice(1)
    user.appendChild(username)
    if (profile.body) {
      Array.from(["b", "s", "l"]).forEach(x => {
        var meta = profile.information.querySelector(x)
        if (meta) {
          var item = document.createElement("span")
          item.className = "application-profile-item"
          item.textContent = x == "b" ? new Date().getFullYear() - new Date(meta.textContent).getFullYear(): meta.textContent
          user.appendChild(item)
        }
      })
    }
    Array.from(["status", "previous", "timestamp"]).forEach(x => {
      if (x in data) {
        container.setAttribute(`data-${x}`, data[x])
      }
    })
    if (data.status) {
      var status = document.createElement("span")
      status.className = "application-profile-status fa-solid"
      user.appendChild(status)
    }
    detail.appendChild(user)
    var about = document.createElement("div")
    about.className = "application-profile-about"
    if (profile.body) {
      about.innerHTML = profile.custom["link-color"] ? this.parseMini(profile.body.textContent, profile.custom["link-color"]): this.parseMini(profile.body.textContent, false)
    }
    detail.appendChild(about)
    member.appendChild(detail)
    container.appendChild(member)
    return container
  }

  async renderMini(node, data) {
    var target = data.username.toLowerCase()
    return new Promise(async (resolve, reject) => {
      var exist = node.querySelector(`.application-profile-container[data-user="${target}"]`)
      if (exist && !data.reload) {
        resolve(exist)
      } else if (target in client.cache.profile && !data.reload) {
        var container = this.applyMini(client.cache.profile[target], target, data)
        if (data.clean) {
          node.replaceChildren(container)
        } else {
          data.first ? node.prepend(container): node.appendChild(container)
        }
        client.cache.wait.mini = client.cache.wait.mini.filter(x => x != target)
        if (target in client.cache.queue.mini) {
          console.log(client.cache.queue.mini[target])
          Object.values(client.cache.queue.mini[target]).forEach(x => {
            delete client.cache.queue.mini[target]
            this.renderMini(x[0], x[1])
          })
        }
        resolve(container)
      } else if (client.cache.wait.mini.includes(target)) {
        var queue = target in client.cache.queue.mini
        !queue ? client.cache.queue.mini[target] = [[node, data]]: client.cache.queue.mini[target].push([node, data])
      } else {
        client.cache.wait.mini.push(target)
        if (data.sidebar) {
          var template = {
            body: false,
            information: false,
            locked: false,
            premium: {
              data: false,
              active: false
            },
            custom: {}
          }
          var placeholder = this.applyMini(template, target, {status: "loading", sidebar: true})
          if (data.clean) {
            node.replaceChildren(placeholder)
          } else {
            data.first ? node.prepend(placeholder): node.appendChild(placeholder)
          }
        }
        await fetch(chatango.subdomain.mod1(target)).then(async response => {
          var content = await response.text()
          var mod1 = new DOMParser()
          var information = mod1.parseFromString(content, "text/xml")
          var parse = information.querySelector("parsererror")
          var profile = {
            body: !parse && information.querySelector("body"),
            information: information,
            locked: information.querySelector("t"),
            premium: {
              data: information.querySelector("d"),
              active: false
            },
            custom: {}
          }
          if (parse) {
            if (target in client.groups) {
              client.externalWarning({close: true, type: "profile"})
              client.setFocus({group: target, reload: true})
            } else {
              /*
              await fetch(`${torch.domain}/who?name=${target}&format=json`).then(async terminated => {
                var terminate = await terminated.json()
                if (terminate.owner) {
                  client.externalWarning({close: true, type: "profile"})
                  document.querySelector('[data-form="join"]').querySelector('[name="group"]').value = target
                  document.querySelector('[data-form="join"]').querySelector('[type="submit"]').click()
                } else if (terminate.response) {
                  console.log("(real)")
                } else {
                  var display = document.createElement("span")
                  display.innerHTML = "About Spam"
                  profile.locked = display
                }
              })
              */
              await fetch(chatango.subdomain.gprofile(target)).then(async terminated => {
                var terminate = await terminated.text()
                var gprofile = new DOMParser()
                var locked = gprofile.parseFromString(terminate, "text/xml")
                var detect = locked.querySelector("gp")
                var display = document.createElement("span")
                display.innerHTML = "About Spam"
                profile.locked = display
              }).catch(error => {
                console.log(error)
              })
            }
          } else if (data.force || profile.premium.data) {
            var active = profile.premium.data && profile.premium.data.textContent * 1000 - Date.now() > 0
            if (data.force || active) {
              var response = await fetch(chatango.subdomain.custom_profile(target))
              if (response.headers.get("content-type") == "text/css") {
                var custom = await response.text()
                var pretty = custom.matchAll(/(\S+): (.*?);/g)
                var capture = Array.from(pretty, y => {
                  var attribute = y[1]
                  var style = y[2]
                  return [attribute, style]
                })
                if (data.force && !active) {
                  var clone = {...profile}
                  client.user.profile.custom = {}
                  profile = client.user.profile
                }
                capture.forEach(y => {
                  var tag = y[0]
                  if (tag == "background-image") {
                    if (tag != "none !important") {
                      var link = y[1].match(/url\((\S+)\)/)
                      if (link) {
                        profile.custom[tag] = chatango.crawl(link[1], true, "image")
                        profile.custom["background-image-source"] = link[1]
                      }
                    }
                  } else if (tag == "color") {
                    if (capture.indexOf(y) == 3) {profile.custom[tag] = y[1]}
                    else if (capture.indexOf(y) == 5) {profile.custom["link-color"] = y[1]}
                  } else {profile.custom[tag] = y[1]}
                })
                if (data.force && !active) {
                  profile = clone
                }
              }
            }
          }
          var container = this.applyMini(profile, target, data)
          if (data.clean) {
            node.replaceChildren(container)
          } else {
            data.first ? node.prepend(container): node.appendChild(container)
          }
          client.cache.profile[target] = profile
          client.cache.wait.mini = client.cache.wait.mini.filter(x => x != target)
          if (target in client.cache.queue.mini) {
            Object.values(client.cache.queue.mini[target]).forEach(x => {
              delete client.cache.queue.mini[target]
              this.renderMini(x[0], x[1])
            })
          }
          resolve(container)
        }).catch(x => {
          reject(x)
        })
      }
    })
  }

  renderIcon(data) {
    var group = data in torch.groups && torch.groups[data].uid ? torch.groups[data].uid: data
    var avatars = this.getAvatar(group)
    var quality = parseInt(client.settings.appearance.messages.quality_group)
    var avatar = document.createElement("img")
    avatar.className = "sidebar-group-avatar"
    avatar.src = data == "community" ? `${torch.static}/img/client.png`: [1, 2].includes(quality) ? avatars.images[2]: avatars.images[1]
    avatar.alt = `#${data} group icon`
    avatar.loading = "lazy"
    if ([2, 4].includes(quality)) {
      avatar.style.imageRendering = "pixelated"
    }
    if (data == "community") {
      avatar.style.backgroundColor = "transparent"
    }
    return avatar
  }

  async renderImage(target, start=0, stop=100000) {
    var spinner = document.createElement("span")
    spinner.className = "content-loading fa-solid fa-spinner"
    document.querySelector('[data-index="scan"]').replaceChildren(spinner)
    await fetch(`${torch.domain}/api/v1/uploads/${target}?start=${start}&stop=${stop}`).then(async response => {
      var data = await response.json()
      if (data.error) return client.renderMedia({id: "imageScan", index: "scan", empty: data.error, source: {}, edit: false})
      var gallery = {}
      data.images.forEach(x => {
        var link = x.link
        gallery[link] = link.split("/").slice(-1)[0]
      })
      client.renderMedia({id: "imageScan", index: "scan", empty: "No images found.", source: gallery, edit: false})
    }).catch(error => {
      console.log(error)
      client.renderMedia({id: "imageScan", index: "scan", empty: "Could not contact server, please try again later.", source: {}, edit: false})
    })
  }

  embed(data, group) {
    var external = `client.externalWarning({url: chatango.link(group), username: '${group}', type: 'profile'})`
    return `<a href="${data}" target="_blank" onclick="${external}; return false">${data}</a>`
    /*
    fetch(`${torch.domain}/who?name=${group}&format=json`).then(async response => {
      var result = await response.json()
      if (result.response) {
        var external = `client.externalWarning({url: 'https://${result.target}.chatango.com', username: '${result.target}', type: 'profile'})`
        return `<a href="${data}" target="_blank" onclick="${external}; return false">${data}</a>`
      } else if (result.owner) {
        console.log("GROOP EMBED OWO")
        return `https://${group}.chatango.com/`
      } else {
        return `https://${group}.chatango.com`
      }
    })
    */
  }

  crawl(data, query, mime, rng, pair, only) {
    var image = data.match(/<i (?=.*s="(https?:\/\/[^<="\s]+\.(?:png|apng|jpg|gif|jpeg|bmp|webp)(?:\?[^<"\s]+)?)").*\/>/i)
    if (image) {
      data = image[1]
    }
    var domain = document.createElement("a")
    domain.href = data.replace("fp.chatango.com", "ust.chatango.com")
    if (domain.hostname.length >= 4) {
      var host = domain.hostname.split(".").slice(-2).join(".")
      if (torch.mirror.indexOf(domain.host) >= 0 || client.cache.whitelist.indexOf(host) >= 0 || !client.settings.safety.media.proxy_media) {
        var link = data.replace("http://", "https://").replace("fp.chatango.com", "ust.chatango.com")
        if (domain.hostname == "127.0.0.1") link = data.replace("https://", "http://")
      } else {
        var amp = data.replaceAll("&amp;", "&")
        var link = `//wsrv.nl/?url=${encodeURIComponent(amp)}&n=-1&default=${torch.domain}/proxy?url=${encodeURIComponent(amp)}`
      }
      if (query) {
        return link
      } else {
        var raw = false
        if (mime == "image" && client.settings.safety.media.embed_image) {
          if (only) {
            return `<img src="${link}" alt="${domain.href}" style="width: auto; max-height: 120px; max-width: 80%" loading="lazy">`
          } else {
            return `<a href="${domain.href}" target="_blank" id="${rng}" referrerpolicy="no-referrer"><img src="${link}" alt="${domain.href}" style="width: auto; max-height: 90px; max-width: 80%" loading="lazy" id="${pair}"></a>`
          }
        } else if (mime == "video" && client.settings.safety.media.embed_video) {
          return `<video width="auto" height="236" controls><source src="${link}" onerror="this.parentNode.outerHTML = this.src"></video>`
        } else if (mime == "audio" && client.settings.safety.media.embed_audio) {
          return `<audio controls><source src="${link}" onerror="this.parentNode.outerHTML = this.src"></audio>`
        } else {
          return data
        }
      }
    }
  }
}

const chatango = new Chatango()

document.querySelector(".login-terms").onchange = x => {
  if (!x.currentTarget.checked) {
    document.querySelector(".login-select").disabled = true
  } else {
    document.querySelector(".login-select").removeAttribute("disabled")
  }
}

document.querySelector(".login-forgot").onclick = () => {
  document.querySelector('[data-login="forgot"]').style.display = "block"
  document.querySelector('[data-select="true"]').style.display = "none"
  document.querySelector('[data-select="true"]').setAttribute("data-select", false)
  document.querySelector('[data-login="forgot"]').setAttribute("data-select", true)
  document.querySelector('[data-login="forgot"]').querySelector("input").focus()
  document.querySelectorAll(".login-button").forEach(x => {
    if (x.value == "Log in") {
      x.value = "Cancel"
    } else if (x.value == "Sign up") {
      x.value = "Send"
    }
  })
}

document.querySelector(".login-email").onclick = () => {
  console.log("open faq to forgor email, client cant help u, contact shitango")
}

document.querySelector(".login-receive").onclick = () => {
  console.log("open to faq to did not receive email, make sure entered correctly, check spam, etc. or contact shitango")
}

document.querySelector(".login-wrapper").querySelectorAll("[tabindex]").forEach(x => {
  x.onkeyup = y => {
    if (y.code == "Space") {
      x.click()
    }
  }
})

async function logGroups(member) {
  var official = []
  var connect = []
  var groups = []
  for (let x in member) {
    var item = {group: x, header: member[x].title, recent: member[x].recent, hidden: member[x].hidden, pending: true}
    if ([torch.environment, "community"].includes(x)) {
      official.push(x)
    } else if (client.settings.privacy.groups.connect_own && !member[x].recent) {
      connect.push(x)
    } else if (client.settings.privacy.groups.connect_recent && member[x].recent) {
      connect.push(x)
    } else if (client.settings.privacy.groups.connect_favorite && client.settings.privacy.groups.favorite.includes(x)) {
      connect.push(x)
    } else {
      item.hidden = true
    }
    groups.push(item)
  }
  if (client.settings.privacy.groups.connect_favorite) {
    client.settings.privacy.groups.favorite.forEach(x => {
      if (!official.includes(x) && !connect.includes(x)) {
        var item = {group: x, header: x[0].toUpperCase() + x.slice(1), recent: true, pending: true}
        connect.push(x)
        groups.push(item)
      }
    })
  }
  var seek = groups.map(x => ![torch.environment, "community"].includes(x.group) ? x.group: false).filter(x => x)
  if (seek.length) {
    await fetch(`${torch.domain}/chatango/group`, {
      method: "POST",
      body: JSON.stringify({get: seek})
    }).then(async response => {
      var data = await response.json()
      torch.groups = data
    })
  }
  groups.reverse().forEach(x => {
    sidebar.renderGroup(x)
  })
  official.concat(connect).forEach(x => {
    client.connect(x).then(socket => {
      client.cache.connect = client.cache.connect.filter(x => x != x)
    }).catch(error => {
      console.log(error)
      client.cache.connect = client.cache.connect.filter(x => x != x)
    })
  })
}

document.getElementById("login").onsubmit = x => {
  x.preventDefault()
  var target = new FormData(x.target)
  var form = Object.fromEntries(target)
  document.querySelectorAll(".login-button").forEach(x => x.disabled = true)
  document.querySelector(".login-fail").textContent = ""
  if (form.user_id && form.password) {
    fetch(x.target.action, {
      method: "POST",
      body: JSON.stringify(form)
    }).then(async response => {
      if (response.status == 200) {
        var data = await response.json()
        if (data.success) {
          if (client.settings.privacy.client.username_title) {
            document.title = `${form.user_id} | The Torch Client`
          }
          client.user.name = form.user_id.toLowerCase()
          client.user.full = form.user_id
          client.emit("clientLogin", client)
          client.requests({username: form.user_id, password: form.password, key: data.key, token: data.token})
          var target = client.user.name
          var member = {
            community: {
              title: "Community",
              recent: true
            },
            env: {
              title: "Environment",
              recent: true,
              hidden: true
            }
          }
          if (data.recent_groups) {
            data.recent_groups.forEach(x => {
              var group = x[0]
              var title = decodeURIComponent(x[1])
              member[group] = {title: title, recent: true}
            })
          }
          if (data.groups) {
            data.groups.forEach(x => {
              var group = x[0]
              var title = decodeURIComponent(x[1])
              member[group] = {title: title, recent: false}
            })
          }

          client.settings.safety.users.ignore.forEach(x => {
            sidebar.renderPerson({username: x, role: "ignored"})
          })

          var storage = indexedDB.open("favorite_media", 1)
          storage.onsuccess = x => {
            client.database.media = x.target.result
            client.viewMedia()
          }
          storage.onerror = () => {
            console.log("could not access media db ;w;")
          }
          storage.onupgradeneeded = x => {
            var db = x.target.result
            var start = db.createObjectStore("media", {keyPath: "url"})
            start.createIndex("url", "url", {unique: true})
            start.createIndex("name", "name", {unique: false})
            start.transaction.oncomplete = y => {
              console.log("media db updated owo")
            }
          }

          client.setConnect({enable: true, icon: "spinner", animation: "rotation 1.5s linear infinite", content: "Connecting..."})

          Array.from(document.querySelector('[data-modal="main"]').querySelector('[data-option="language"]').children).forEach(x => {
            document.querySelector('[data-modal="userSettings"]').querySelector('[data-option="language"]').appendChild(x)
          })
          Array.from(document.querySelector('[data-modal="main"]').querySelector('[data-option="theme"]').children).forEach(x => {
            document.querySelector('[data-modal="userSettings"]').querySelector('[data-option="theme"]').appendChild(x)
          })
          var ease = document.querySelector('[data-modal="main"]').querySelector('[data-option="ease"]').querySelector(".modal-content")
          document.querySelector('[data-modal="userSettings"]').querySelector('[data-option="display"]').appendChild(ease)
          setTimeout(x => {document.querySelector(".login").remove()}, 1000)
          document.querySelector(".application").classList.remove("display-none")

          await fetch(chatango.subdomain.msgstyles(target)).then(async response => {
            if (response.headers.get("content-type") == "application/octet-stream") {
              var content = await response.json()
              var fonts = document.querySelector('[data-preload="fonts"]')
              client.user.background = !!+content.usebackground
              document.querySelector('[name="usebackground"]').checked = client.user.background
              if (content.stylesOn) {
                client.user.style = true
              } else {
                document.querySelector('[data-preload="fonts"]').querySelector('[name="stylesOn"]').checked = false
              }
              if (content.bold) {
                fonts.querySelector(".fa-bold").previousElementSibling.checked = true
              }
              if (content.italics) {
                fonts.querySelector(".fa-italic").previousElementSibling.checked = true
              }
              if (content.underline) {
                fonts.querySelector(".fa-underline").previousElementSibling.checked = true
              }
              if (content.fontFamily) {
                fonts.querySelector(".font-face").firstElementChild.value = content.fontFamily
              }
              if (content.fontSize) {
                fonts.querySelector(".font-size .text-input").value = content.fontSize
              }
              var nameColor = content.nameColor && content.nameColor.length ? "#" + content.nameColor: "#000000"
              if (nameColor) {
                fonts.querySelector('[data-color="nameColor"]').value = nameColor
                fonts.querySelector('[data-color-input="nameColor"]').value = nameColor
                fonts.querySelector('[data-color-input="nameColor"]').style.color = nameColor
              }
              var textColor = content.textColor && content.textColor.length ? "#" + content.textColor: "#000000"
              if (textColor) {
                fonts.querySelector('[data-color="fontColor"]').value = textColor
                fonts.querySelector('[data-color-input="fontColor"]').value = textColor
                fonts.querySelector('[data-color-input="fontColor"]').style.color = textColor
              }
            }
          }).then(async () => {
            await logGroups(member)
          }).catch(async error => {
            console.log(error)
            await logGroups(member)
          })
          if (data.n_msg) {
            document.querySelector('[data-sidebar="private"]').classList.add("application-icon-mention")
            document.querySelector('[data-sidebar="private"]').setAttribute("data-amount", data.n_msg)
          }

          setTimeout(() => {
            if (client.settings.privacy.private_messages.connect_start) {
              document.querySelector('[data-sidebar="private"]').click()
            }
          }, 6000)
          document.querySelector(".application-chat-box").onscroll = () => {
            var height = (document.querySelector(".application-chat-box").scrollHeight - document.querySelector(".application-chat-box").clientHeight)
            var top = height - -document.querySelector(".application-chat-box").scrollTop
            if (client.groups[client.focus].ready && client.groups[client.focus].ready != "wait" && client.groups[client.focus].load != -1 && [0, 1].indexOf(top) >= 0) {
              //client.renderMessage({content: "Previous messages above", banner: true, unique: "previous", position: "afterbegin"})
              client.groups[client.focus].socket.send(`get_more:20:${client.groups[client.focus].load}\r\n`)
              client.groups[client.focus].load = 0
              client.groups[client.focus].ready = "wait"
              setTimeout(x => {
                //document.querySelector(".application-chat-wrapper").querySelector(".chat-banner-item").scrollIntoView({behavior: "smooth", block: "nearest"})
              }, 1000)
            }
          }

          document.querySelector(".application-user-avatar").src = chatango.subdomain.thumb_m(target)

          await client.setProfile(data.profile)

          var layer = document.querySelectorAll(".external-modal-avatar [data-button]:not([data-cancel])")

          document.querySelector('.external-modal-avatar [data-button="save"]').onclick = () => {
            layer.forEach(x => x.disabled = true)
            var box = document.querySelector(".external-avatar-image").cropper.getData()
            var payload = {auth: "token", arch: "h5", src: "group", action: "thumb", x0: Math.round(box.x), y0: Math.round(box.y), ts: Math.round(box.width)}
            var form = new FormData()
            for (let x in payload) {
              form.set(x, payload[x])
            }
            client.post(chatango.path("updateprofile"), form, {}).then(async response => {
              var combine = response.split("&").map(x => x.split("="))
              var sign = new Map(combine)
              await client.setProfile(Object.fromEntries(sign), "Your avatar has been saved.")
              layer.forEach(x => x.disabled = false)
            }).catch(error => {
              client.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: error.message})
              layer.forEach(x => x.disabled = false)
            })
          }
          document.querySelector('[data-form="avatar"]').onsubmit = x => {
            x.preventDefault()
            layer.forEach(x => x.disabled = true)
            var form = new FormData(x.target)
            if (document.querySelector(".external-avatar-image").cropper) {
              document.querySelector(".external-avatar-image").cropper.destroy()
            }
            client.post(chatango.path("updateprofile"), form, {
              progress: true,
              status: {
                403: () => {
                  console.log("malformatted data")
                }
              }
            }).then(async response => {
              console.log(response)
              layer.forEach(x => x.disabled = false)
              client.user.avatar = false
              document.querySelector('[data-profile="preview"] .chat-message-avatar').click()
            }).catch(error => {
              console.log(error)
              layer.forEach(x => x.disabled = false)
            })
          }
          document.querySelector('.external-modal-avatar [data-button="upload"]').onclick = () => {
            document.querySelector('[data-upload="avatar"]').click()
          }
          document.querySelector('.external-modal-avatar [data-button="remove"]').onclick = async () => {
            layer.forEach(x => x.disabled = true)
            if (document.querySelector(".external-avatar-image").cropper) {
              document.querySelector(".external-avatar-image").cropper.destroy()
            }
            var form = new FormData()
            var noimage = await fetch(`${torch.static}/noimage.jpg`)
            var blob = await noimage.blob()
            var file = new File([blob], "noimage.jpg", {type: blob.type})
            form.set("auth", "token")
            form.set("arch", "h5")
            form.set("src", "group")
            form.set("action", "fullpic")
            form.set("Filedata", file)
            client.post(chatango.path("updateprofile"), form, {
              progress: true
            }).then(async response => {
              console.log(response)
              layer.forEach(x => x.disabled = false)
              client.user.avatar = {x0: 50, y0: 50, ts: 50}
              document.querySelector('[data-profile="preview"] .chat-message-avatar').click()
            }).catch(error => {
              console.log(error)
              layer.forEach(x => x.disabled = false)
            })
          }
          document.querySelector('.external-modal-avatar [data-button="cancel"]').onclick = () => {
            var action = document.querySelector(".application-notice-action")
            if (action && action.textContent == "Cancel") {
              action.click()
            }
            client.externalWarning({close: true, type: "avatar"})
          }

          chatango.getBackground({username: target, node: target})

          var about = decodeURIComponent(data.eline)
          var tracker = about.match(/<script src="(?:https:)?\/\/vissle.me\/profile\/(\d+)"><\/script>/)
          document.querySelector("#chatango-make").onmouseup = x => {
            if (x.target == x.currentTarget) {
              x.currentTarget.close()
            }
          }
          document.querySelector('[data-content="profile"] .filter-apply').onclick = () => {
            if (!document.querySelector('#chatango-make input[type="text"]').value) {
              var flag = 512
              if (tracker) {
                flag = tracker[1]
              }
              document.querySelector('#chatango-make input[type="text"]').value = `<script src="//vissle.me/profile/${flag}"></script>`
            }
            document.getElementById("chatango-make").showModal()
          }
          document.querySelector('[data-content="profile"] .filter-reset').onclick = () => {
            var about = document.querySelector('[data-text-field="about"]')
            about.value = about.value.replace(/(\n)?(<script src="(?:https:)?\/\/vissle.me\/profile\/\d+"><\/script>)/, "")
            document.querySelector('[data-content="profile"] .filter-apply').textContent = "Add profile tracker"
            about.focus()
          }
          var tcFlagged = document.querySelectorAll("#chatango-make .ease-item [data-flag]")
          tcFlagged.forEach(x => {
            if (tracker) {
              var flag = x.getAttribute("data-flag")
              if (parseInt(flag) & parseInt(tracker[1])) {
                x.querySelector("input").checked = true
              }
            }
            x.onchange = y => {
              let value = Array.from(tcFlagged).map(z => {
                if (z.querySelector("input").checked) {
                  return parseInt(z.getAttribute("data-flag"))
                } else {
                  return 0
                }
              }).reduce((a, b) => a + b)
              document.querySelector('#chatango-make input[type="text"]').value = `<script src="//vissle.me/profile/${value + 512}"></script>`
              document.querySelector('#chatango-make input[type="text"]').focus()
              var parent = document.querySelector('#chatango-make input[type="text"]')
              var range = document.createRange()
              range.selectNodeContents(parent)
              range.collapse(false)
              var selection = getSelection()
              selection.removeAllRanges()
              selection.addRange(range)
            }
          })
          document.querySelector('#chatango-make [data-button="save"]').onclick = y => {
            var text = y.currentTarget.parentNode.firstElementChild.value
            var about = document.querySelector('[data-text-field="about"]')
            var tracked = about.value.match(/(\n)?(<script src="(?:https:)?\/\/vissle.me\/profile\/\d+"><\/script>)/)
            if (tracked) {
              if (about.value.length < 2000 - tracked[2].length) {
                about.value = about.value.replace(tracked[2], text)
              } else {
                client.setNotice({enable: true, icon: "warning", color: "var(--theme-passive)", content: "Not enough room in mini for profile tracker."})
              }
            } else {
              if (about.value.length < 2000 - ("\n" + text).length) {
                about.value = about.value += "\n" + text
                document.querySelector('[data-content="profile"] .filter-apply').textContent = "Edit profile tracker"
              } else {
                client.setNotice({enable: true, icon: "warning", color: "var(--theme-passive)", content: "Not enough room in mini for profile tracker."})
              }
            }
            document.querySelector("#chatango-make").close()
            about.focus()
          }

          document.querySelector('[data-text-field="about"]').onkeyup = x => {
            document.querySelector('[data-profile="preview"] .application-profile-about').innerHTML = chatango.parseMini(x.currentTarget.value)
          }

          document.querySelector('[data-option-button="about"] [data-button="save"]').onclick = () => {
            var query = {
              age: "age",
              gender: "gender",
              location: "location",
              line: "about",
              full_profile: "full"
            }
            var payload = {
              auth: "token",
              arch: "h5",
              src: "group",
              action: "update"
            }
            for (let x in query) {
              var item = query[x]
              payload[x] = document.querySelector(`[data-text-field="${item}"]`).value
            }
            if (document.querySelector('[data-setting="show_profile"] input').checked) payload.dir = "checked"
            var form = new FormData()
            for (let x in payload) {
              form.set(x, payload[x])
            }
            client.post(chatango.path("updateprofile"), form, {}).then(async response => {
              var combine = response.split("&").map(x => x.split("="))
              var sign = new Map(combine)
              await client.setProfile(Object.fromEntries(sign), "Your profile has been saved.")
            }).catch(error => {
              client.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: error.message})
            })
          }
        } else {
          document.querySelectorAll(".login-button").forEach(x => {x.removeAttribute("disabled")})
          document.querySelector(".login-fail").textContent = data.error
        }
      } else {
        document.querySelectorAll(".login-button").forEach(x => {x.removeAttribute("disabled")})
        document.querySelector(".login-fail").textContent = "An error occurred."
      }
    }).catch(x => {
      console.log(x)
      document.querySelectorAll(".login-button").forEach(x => {x.removeAttribute("disabled")})
      document.querySelector(".login-fail").textContent = "Could not contact server."
    })
  }
}

document.getElementById("register").onsubmit = x => {
  x.preventDefault()
  var form = new FormData(x.target)
  var data = Object.fromEntries(form)
  document.querySelectorAll(".login-button").forEach(x => x.disabled = true)
  document.querySelector(".login-fail").textContent = ""
  if (data.email && data.user_id && data.password) {
    fetch(x.target.action, {
      method: "POST",
      body: JSON.stringify(data)
    }).then(async response => {
      if (response.status == 200) {
        var data = await response.json()
        if (data.success) {
          sidebar.renderGroup({group: "community", header: "Community", recent: true})
        } else {
          document.querySelectorAll(".login-button").forEach(x => {x.removeAttribute("disabled")})
          document.querySelector(".login-fail").textContent = data.error
        }
      } else {
        document.querySelectorAll(".login-button").forEach(x => {x.removeAttribute("disabled")})
        document.querySelector(".login-fail").textContent = "An error occurred."
      }
    }).catch(x => {
      document.querySelectorAll(".login-button").forEach(x => {x.removeAttribute("disabled")})
      document.querySelector(".login-fail").textContent = "Could not contact server."
    })
  }
}

document.forms.forgot.onsubmit = x => {
  x.preventDefault()
  console.log("TODO: send email to forgot")
}

document.querySelectorAll(".login-button").forEach(x => {
  x.disabled = false
  x.onclick = () => {
    document.querySelector(".login-select").removeAttribute("disabled")
    document.querySelector(".login-select").classList.toggle("login-select")
    document.querySelector('[data-select="true"]').setAttribute("data-select", false)
    if (x.value == "Log in") {
      x.classList.add("login-select")
      if (document.querySelector('[data-login="return"]').style.display == "block") {
        document.querySelector('[data-hide="return"]').click()
        document.querySelector('[data-login="return"]').setAttribute("data-select", true)
      } else {
        document.querySelector('[data-login="return"]').setAttribute("data-select", true)
        document.querySelector('[data-login="return"]').style.display = "block"
        document.querySelector('[data-login="register"]').style.display = "none"
        document.querySelector('[data-login="return"]').querySelector("input").focus()
      }
    } else if (x.value == "Sign up") {
      if (!document.querySelector(".login-terms").checked) {
        x.disabled = true
      }
      x.classList.add("login-select")
      if (document.querySelector('[data-login="register"]').style.display == "block") {
        document.querySelector('[data-hide="register"]').click()
        document.querySelector('[data-login="register"]').setAttribute("data-select", true)
      } else {
        document.querySelector('[data-login="register"]').setAttribute("data-select", true)
        document.querySelector('[data-login="return"]').style.display = "none"
        document.querySelector('[data-login="register"]').style.display = "block"
        document.querySelector('[data-login="register"]').querySelector("input").focus()
      }
    } else if (x.value == "Cancel" || x.value == "Back") {
      x.classList.add("login-select")
      if (document.querySelector('[data-login="password"]').style.display == "block") {
        x.value = "Cancel"
        x.parentNode.lastElementChild.value = "Send"
        document.querySelector('[data-login="forgot"]').setAttribute("data-select", true)
        document.querySelector('[data-login="forgot"]').style.display = "block"
        document.querySelector('[data-login="password"]').style.display = "none"
        document.querySelector('[data-login="forgot"]').querySelector("input").focus()
      } else {
        x.value = "Log in"
        x.parentNode.lastElementChild.value = "Sign up"
        document.querySelector('[data-login="return"]').setAttribute("data-select", true)
        document.querySelector('[data-login="return"]').style.display = "block"
        document.querySelector('[data-login="forgot"]').style.display = "none"
        document.querySelector('[data-login="return"]').querySelector("input").focus()
      }
    } else if (x.value == "Send" || x.value == "Change") {
      x.classList.add("login-select")
      if (document.querySelector('[data-login="password"]').style.display == "block") {
        console.log("login with password from email and set new password")
      } else {
        console.log("send new pw to email provided")
        document.forms.forgot.querySelector('[type="submit"]').click()
        x.value = "Change"
        x.parentNode.firstElementChild.value = "Back"
        document.querySelector('[data-login="password"]').setAttribute("data-select", true)
        document.querySelector('[data-login="password"]').style.display = "block"
        document.querySelector('[data-login="forgot"]').style.display = "none"
        document.querySelector('[data-login="password"]').querySelector("input").focus()
      }
    }
  }
})

function attachMenu(data, type) {
  var list = data.getAttribute("data-list")
  if (list) {
    if (type == 1) {
      var target = document.querySelector(".modal")
      var main = target.querySelector(".modal-option-select")
      var unselect = target.querySelector(".modal-menu-select")
      var deselect = target.querySelector(".modal-item-select")
      document.querySelector(".menu-wrapper").style.display = "none"
      if (target.firstElementChild.getAttribute("data-modal") == "main") {
        document.querySelector(".login-modal").classList.add("login-modal-active")
        target.firstElementChild.classList.add("modal-view")
        document.querySelector(".login-wrapper").style.display = "none"
        document.querySelector(".login-footer").style.display = "none"
      } else {
        target.style.display = "block"
      }
      target.classList.add("modal-select")
      if (main) {main.classList.remove("modal-option-select")}
      if (unselect) {unselect.classList.remove("modal-menu-select")}
      if (deselect) {deselect.classList.remove("modal-item-select")}
      target.querySelector(`.modal-${data.getAttribute("data-list")}`).classList.add("modal-option-select")
      target.querySelector(`[data-menu="${data.getAttribute("data-menu")}"]`).classList.add("modal-menu-select")
      target.querySelector(`[data-option="${data.getAttribute("data-menu")}"]`).classList.add("modal-item-select")
    } else {
      var bruh = data.parentNode.getAttribute("data-class")
      var modal = document.querySelector(`[data-modal="${bruh}"]`)
      var main = modal.querySelector(".modal-option-select")
      var deselect = modal.querySelector(".modal-item-select")
      var unselect = modal.querySelector(".modal-menu-select")
      if (main) {main.classList.remove("modal-option-select")}
      if (deselect) {deselect.classList.remove("modal-item-select")}
      if (unselect) {unselect.classList.remove("modal-menu-select")}
      data.classList.add("modal-menu-select")
      modal.querySelector(`.modal-${data.getAttribute("data-list")}`).classList.add("modal-option-select")
      modal.querySelector(`[data-option="${data.getAttribute("data-menu")}"]`).classList.add("modal-item-select")
      var notice = document.querySelector(".application-notice")
      document.querySelector(`[data-modal="${bruh}"] .modal-option-select`).prepend(notice)
    }
  }
}

function changeMenu(target, data) {
  var modal = document.querySelector(`[data-modal="${target}"]`)
  var main = modal.querySelector(".modal-option-select")
  if (main) {
    main.classList.remove("modal-option-select")
  }
  var deselect = modal.querySelector(".modal-item-select")
  if (deselect) {
    deselect.classList.remove("modal-item-select")
  }
  var unselect = modal.querySelector(".modal-menu-select")
  if (unselect) {
    unselect.classList.remove("modal-menu-select")
  }
  var menu = document.querySelector(`[data-menu="${data}"]`)
  var list = menu.getAttribute("data-list")
  menu.classList.add("modal-menu-select")
  modal.querySelector(`.modal-${list}`).classList.add("modal-option-select")
  modal.querySelector(`[data-option="${data}"]`).classList.add("modal-item-select")
}

document.querySelectorAll(".menu-item").forEach(x => {
  x.onclick = () => {
    attachMenu(x, 1)
    document.querySelector(".modal-list").querySelectorAll("[tabindex]").forEach(y => {
      y.setAttribute("tabindex", 0)
    })
  }
  x.onkeyup = y => {
    if (y.code == "Space") {
      attachMenu(x, 1)
      document.querySelector(".modal-list").querySelectorAll("[tabindex]").forEach(y => {
        y.setAttribute("tabindex", 0)
      })
    }
  }
})



document.querySelectorAll(".modal-menu-item").forEach(x => {
  x.onclick = () => {
    attachMenu(x, 2)
  }
  x.onkeyup = y => {
    if (y.code == "Space") {
      attachMenu(x, 2)
      document.querySelector(".menu-side").focus()
    }
  }
})

document.querySelector(".menu-side").onchange = (x) => {
  if (!x.currentTarget.checked) {
    document.querySelector(".menu-wrapper").querySelectorAll("[tabindex]").forEach(y => {
      y.setAttribute("tabindex", -1)
    })
    if (document.querySelector(".menu-wrapper").style.display == "none") {
      var deselect = document.querySelector(".modal-item-select")
      if (deselect) {deselect.classList.remove("modal-item-select")}
      document.querySelector(".modal-list").querySelectorAll("[tabindex]").forEach(y => {
        y.setAttribute("tabindex", -1)
      })
      document.querySelector('[data-modal="main"]').classList.remove("modal-view")
      document.querySelector(".login-modal").classList.remove("login-modal-active")
      document.querySelector(".login-modal").classList.remove("modal-select")
      document.querySelector(".menu-wrapper").removeAttribute("style")
      document.querySelector(".login-wrapper").removeAttribute("style")
      document.querySelector(".login-footer").removeAttribute("style")
    }
  } else {
    document.querySelector(".menu-wrapper").querySelectorAll("[tabindex]").forEach(y => {
      y.setAttribute("tabindex", 0)
    })
  }
}

/* MAIN MENU THEME */

function incrementalTheme() {
  var amount = document.querySelectorAll(".theme-custom").length
  for (var x = 1; x <= amount; x++) {
    var exist = document.querySelector(`[data-save="${x}"]`)
    if (!exist) {return x}
    else {
      if (x >= amount - 1) {return amount}
    }
  }
}

function applyTheme(data) {
  var root = document.querySelector(":root")
  var theme = document.querySelector("[data-theme]")
  var select = theme.getAttribute("data-theme")
  var style = document.querySelector(`[data-theme="${select}"]`)
  var compute = getComputedStyle(style)
  var create = document.createElement("div")
  create.onclick = x => {
    var selected = document.querySelector(".theme-select")
    if (selected) {selected.classList.remove("theme-select")}
    x.currentTarget.classList.add("theme-select")
    x.currentTarget.querySelectorAll(".custom-edit").forEach(x => {root.style.setProperty(`--custom-${x.getAttribute("data-custom")}`, x.value)})
    root.style.setProperty(`--custom-backdrop`, x.currentTarget.querySelector(".custom-backdrop").value)
    document.body.setAttribute("data-theme", "custom")
    var identifier = x.currentTarget.querySelector(".theme-wrapper").getAttribute("data-save")
    localStorage.setItem("theme-select", `custom-theme-${identifier}`)
  }
  create.className = "theme-background theme-custom"
  create.style.backgroundColor = data ? data.backdrop: "var(--theme-backdrop)"
  var palette = document.createElement("div")
  palette.className = "theme-palette"
  if (!data) {
    var data = {
      primary: compute.getPropertyValue("--theme-primary").trim(),
      secondary: compute.getPropertyValue("--theme-secondary").trim(),
      backdrop: compute.getPropertyValue("--theme-backdrop").trim(),
      text: {
        1: compute.getPropertyValue("--theme-text-title").trim(),
        2: compute.getPropertyValue("--theme-text-description").trim()
      },
      compliment: {
        1: compute.getPropertyValue("--theme-highlight").trim(),
        2: compute.getPropertyValue("--theme-passive").trim(),
      },
      active: compute.getPropertyValue("--theme-active").trim(),
    }
  }
  for (var x in data) {
    if (x != "backdrop") {
      var theme = document.createElement("div")
      theme.className = "theme-color custom-theme"
      if (x == "text" || x == "compliment") {
        theme.style.background = `linear-gradient(90deg, ${data[x][1]} 50%, ${data[x][2]} 50%)`
        var edit = document.createElement("input")
        edit.type = "text"
        edit.value = data[x][1]
        edit.setAttribute("data-custom", x == "text" ? "text-title": "highlight")
        edit.oninput = y => {
          var empty = y.currentTarget.value.trim().length ? y.currentTarget.value.trim(): "#"
          var hex = empty.match(/^([a-f\d]{3}|[a-f\d]{6})$/i)
          var clean = hex ? `#${hex[1]}`: empty
          if (hex) {y.curentTarget.value = clean}
          y.currentTarget.style.color = clean
          y.currentTarget.parentNode.style.background = y.currentTarget.parentNode.style.background.replace(/90deg, (.*?) 50%/, `90deg, ${clean} 50%`)
          var identifier = y.currentTarget.parentNode.parentNode.parentNode.querySelector(".theme-wrapper").getAttribute("data-save")
          var unsaved = localStorage.getItem(`custom-theme-${identifier}`)
          if (unsaved) {
            var source = JSON.parse(unsaved)
            if (source[y.currentTarget.getAttribute("data-custom")] != y.currentTarget.value) {y.currentTarget.parentNode.parentNode.nextElementSibling.querySelector(".theme-save").classList.add("theme-unsaved")}
            else {y.currentTarget.parentNode.parentNode.nextElementSibling.querySelector(".theme-save").classList.remove("theme-unsaved")}
          } else {y.currentTarget.parentNode.parentNode.nextElementSibling.querySelector(".theme-save").classList.add("theme-unsaved")}
        }
        edit.className = "custom-edit"
        edit.style.color = data[x][1]
        theme.appendChild(edit)
        var edit = document.createElement("input")
        edit.type = "text"
        edit.value = data[x][2]
        edit.setAttribute("data-custom", x == "text" ? "text-description": "passive")
        edit.oninput = y => {
          var empty = y.currentTarget.value.trim().length ? y.currentTarget.value.trim(): "#"
          var hex = empty.match(/^([a-f\d]{3}|[a-f\d]{6})$/i)
          var clean = hex ? `#${hex[1]}`: empty
          if (hex) {y.currentTarget.value = clean}
          y.currentTarget.style.color = clean
          y.currentTarget.parentNode.style.background = y.currentTarget.parentNode.style.background.replace(/50%, (.*?) 50%/, `50%, ${clean} 50%`)
          var identifier = y.currentTarget.parentNode.parentNode.parentNode.querySelector(".theme-wrapper").getAttribute("data-save")
          var unsaved = localStorage.getItem(`custom-theme-${identifier}`)
          if (unsaved) {
            var source = JSON.parse(unsaved)
            if (source[y.currentTarget.getAttribute("data-custom")] != y.currentTarget.value) {y.currentTarget.parentNode.parentNode.nextElementSibling.querySelector(".theme-save").classList.add("theme-unsaved")}
            else {y.currentTarget.parentNode.parentNode.nextElementSibling.querySelector(".theme-save").classList.remove("theme-unsaved")}
          } else {y.currentTarget.parentNode.parentNode.nextElementSibling.querySelector(".theme-save").classList.add("theme-unsaved")}
        }
        edit.className = "custom-edit"
        edit.style.color = data[x][2]
        theme.appendChild(edit)
      } else {
        theme.style.backgroundColor = data[x]
        var edit = document.createElement("input")
        edit.type = "text"
        edit.value = data[x]
        edit.setAttribute("data-custom", x)
        edit.oninput = y => {
          var empty = y.currentTarget.value.trim().length ? y.currentTarget.value.trim(): "#"
          var hex = empty.match(/^([a-f\d]{3}|[a-f\d]{6})$/i)
          var clean = hex ? `#${hex[1]}`: empty
          if (hex) {y.currentTarget.value = clean}
          y.currentTarget.style.color = clean
          y.currentTarget.parentNode.style.backgroundColor = clean
          var identifier = y.currentTarget.parentNode.parentNode.parentNode.querySelector(".theme-wrapper").getAttribute("data-save")
          var unsaved = localStorage.getItem(`custom-theme-${identifier}`)
          if (unsaved) {
            var source = JSON.parse(unsaved)
            if (source[y.currentTarget.getAttribute("data-custom")] != y.currentTarget.value) {y.currentTarget.parentNode.parentNode.nextElementSibling.querySelector(".theme-save").classList.add("theme-unsaved")}
            else {y.currentTarget.parentNode.parentNode.nextElementSibling.querySelector(".theme-save").classList.remove("theme-unsaved")}
          } else {y.currentTarget.parentNode.parentNode.nextElementSibling.querySelector(".theme-save").classList.add("theme-unsaved")}
        }
        edit.className = "custom-edit"
        edit.style.color = data[x]
        theme.appendChild(edit)
      }
      palette.appendChild(theme)
    }
  }
  create.appendChild(palette)
  var attach = incrementalTheme()
  var wrapper = document.createElement("div")
  wrapper.className = "theme-wrapper"
  wrapper.setAttribute("data-save", attach)
  var save = document.createElement("span")
  save.onclick = x => {
    var identifier = x.currentTarget.parentNode.getAttribute("data-save")
    var source = {}
    x.currentTarget.parentNode.parentNode.querySelectorAll(".custom-edit").forEach(x => {
      source[x.getAttribute("data-custom")] = x.value.trim()
    })
    source.backdrop = x.currentTarget.parentNode.parentNode.querySelector(".custom-backdrop").value
    var saving = JSON.stringify(source)
    localStorage.setItem(`custom-theme-${identifier}`, saving)
    x.currentTarget.classList.remove("theme-unsaved")
  }
  save.onkeyup = x => {
    if (x.code == "Space") {
      x.currentTarget.click()
    }
  }
  save.className = "theme-save fa-solid fa-floppy-disk"
  save.setAttribute("tabindex", 0)
  wrapper.appendChild(save)
  var link = document.createElement("a")
  link.download = "owo.json"
  var download = document.createElement("span")
  download.onclick = x => {
    var identifier = x.currentTarget.parentNode.getAttribute("data-save")
    var source = {}
    x.currentTarget.parentNode.parentNode.querySelectorAll(".custom-edit").forEach(x => {
      source[x.getAttribute("data-custom")] = x.value.trim()
    })
    source.backdrop = x.currentTarget.parentNode.parentNode.querySelector(".custom-backdrop").value
    var downloading = JSON.stringify(source)
    link.href = `data:text/json,${encodeURIComponent(downloading)}`
    link.click()
  }
  download.onkeyup = x => {
    if (x.code == "Space") {
      x.currentTarget.click()
    }
  }
  download.className = "theme-download fa-solid fa-download"
  download.setAttribute("tabindex", 0)
  wrapper.appendChild(download)
  var nameTheme = document.createElement("span")
  nameTheme.textContent = `#${attach}`
  wrapper.appendChild(nameTheme)
  var remove = document.createElement("span")
  remove.onclick = x => {
    var identifier = x.currentTarget.parentNode.getAttribute("data-save")
    x.currentTarget.parentNode.parentNode.remove()
    setTimeout(() => {
      document.querySelector(".theme-dark").classList.add("theme-select")
      document.body.setAttribute("data-theme", "dark")
    }, 500)
    localStorage.removeItem(`custom-theme-${identifier}`)
  }
  remove.onkeyup = x => {
    if (x.code == "Space") {
      x.currentTarget.click()
      setTimeout(() => {
        document.querySelector(".theme-light").focus()
      }, 800)
    }
  }
  remove.className = "theme-delete fa-solid fa-trash-can"
  remove.setAttribute("tabindex", 0)
  wrapper.appendChild(remove)
  var backdrop = document.createElement("input")
  backdrop.type = "color"
  backdrop.value = data.backdrop
  backdrop.oninput = x => {
    x.currentTarget.parentNode.parentNode.style.backgroundColor = x.currentTarget.value
    root.style.setProperty("--custom-backdrop", x.currentTarget.value)
    var identifier = x.currentTarget.parentNode.getAttribute("data-save")
    var unsaved = localStorage.getItem(`custom-theme-${identifier}`)
    if (unsaved) {
      var source = JSON.parse(unsaved)
      if (source.backdrop != x.currentTarget.value) {x.currentTarget.parentNode.querySelector(".theme-save").classList.add("theme-unsaved")}
      else {x.currentTarget.parentNode.querySelector(".theme-save").classList.remove("theme-unsaved")}
    } else {x.currentTarget.parentNode.querySelector(".theme-save").classList.add("theme-unsaved")}
  }
  backdrop.className = "custom-backdrop"
  wrapper.appendChild(backdrop)
  var edit = document.createElement("span")
  edit.className = "theme-edit fa-solid fa-pen-to-square"
  wrapper.appendChild(edit)
  create.appendChild(wrapper)
  document.querySelector(".theme-placeholder").insertAdjacentElement("beforebegin", create)
}

// Drag a file on to the uploader, clean the data and then pass to applyTheme
document.querySelector(".custom-interface").ondrop = x => {
  x.preventDefault()
  document.querySelector(".theme-import").classList.remove("theme-drag")
  Array.from(x.dataTransfer.files).forEach(y => {
    var read = new FileReader()
    read.readAsText(y, "utf-8")
    read.onload = x => {
      var text = x.currentTarget.result
      try {
        var source = JSON.parse(text)
        var arrange = {
          text: {
            1: false,
            2: false
          },
          compliment: {
            1: false,
            2: false
          }
        }
        for (var y in source) {
          if (y == "text-title") {arrange.text[1] = source[y]}
          else if (y == "text-description") {arrange.text[2] = source[y]}
          else if (y == "highlight") {arrange.compliment[1] = source[y]}
          else if (y == "passive") {arrange.compliment[2] = source[y]}
          else {arrange[y] = source[y]}
        }
        applyTheme(arrange)
      } catch(error) {console.log("invalid")}
    }
  })
}

document.querySelector(".custom-interface").ondragover = x => {
  x.preventDefault()
  x.dataTransfer.dropEffect = "move"
  document.querySelector(".theme-import").classList.add("theme-drag")
}

document.querySelector(".custom-interface").ondragleave = x => {
  x.preventDefault()
  document.querySelector(".theme-import").classList.remove("theme-drag")
}

document.querySelector(".theme-import").onclick = () => {
  document.querySelector(".import-theme").click()
}

document.querySelector(".theme-import").onkeyup = x => {
  if (x.code == "Space") {
    x.currentTarget.click()
  }
}

// Upload a downloaded theme, clean the data and thne pass to applyTheme
document.querySelector(".import-theme").onchange = x => {
  Array.from(x.currentTarget.files).forEach(x => {
    var read = new FileReader()
    read.readAsText(x, "utf-8")
    read.onload = y => {
      var text = y.currentTarget.result
      try {
        var source = JSON.parse(text)
        var arrange = {
          text: {
            1: false,
            2: false
          },
          compliment: {
            1: false,
            2: false
          }
        }
        for (var y in source) {
          if (y == "text-title") {arrange.text[1] = source[y]}
          else if (y == "text-description") {arrange.text[2] = source[y]}
          else if (y == "highlight") {arrange.compliment[1] = source[y]}
          else if (y == "passive") {arrange.compliment[2] = source[y]}
          else {arrange[y] = source[y]}
        }
        applyTheme(arrange)
      } catch(error) {console.log("invalid")}
    }
  })
  x.currentTarget.value = ""
}

document.querySelector(".theme-new").onclick = function() {applyTheme(false)}

document.querySelector(".theme-new").onkeyup = x => {
  if (x.code == "Space") {
    x.currentTarget.click()
  }
}

const themes = ["dark", "light"]

themes.forEach(x => {
  var theme = document.createElement("div")
  theme.className = `theme-background theme-${x}`
  theme.setAttribute("data-theme", x)
  theme.setAttribute("data-theme-preset", x)
  theme.setAttribute("tabindex", 0)
  var palette = document.createElement("div")
  palette.className = "theme-palette"
  Array.from(["primary", "secondary", "text", "compliment", "active"]).forEach(y => {
    var color = document.createElement("div")
    color.className = `theme-color ${x}-${y}`
    palette.appendChild(color)
  })
  theme.appendChild(palette)
  var wrapper = document.createElement("div")
  wrapper.className = "theme-wrapper"
  wrapper.textContent = x[0].toUpperCase() + x.slice(1)
  theme.appendChild(wrapper)
  document.querySelector('[data-option="theme"]').querySelector(".modal-content").appendChild(theme)
})

document.querySelectorAll("[data-theme-preset]").forEach(x => {
  var style = getComputedStyle(x)
  var colors = {
    primary: style.getPropertyValue("--theme-background"),
    secondary: style.getPropertyValue("--theme-secondary"),
    backdrop: style.getPropertyValue("--theme-backdrop"),
    text: [style.getPropertyValue("--theme-text-title"), style.getPropertyValue("--theme-text-description")],
    compliment: [style.getPropertyValue("--theme-highlight"), style.getPropertyValue("--theme-passive")],
    active: style.getPropertyValue("--theme-active")
  }
  x.style.color = colors.text[0]
  x.style.backgroundColor = colors.backdrop
  Array.from(["primary", "secondary", "text", "compliment", "active"]).forEach(y => {
    var color = x.querySelector(`.${x.getAttribute("data-theme-preset")}-${y}`)
    if (colors[y].length == 2) {
      var format = `linear-gradient(90deg, ${colors[y][0]} 50%, ${colors[y][1]} 50%)`
      color.style.background = format
    } else {
      color.style.backgroundColor = colors[y]
    }
  })
  x.onclick = y => {
    var theme = x.getAttribute("data-theme-preset")
    var select = document.querySelector(".theme-select")
    if (select) {select.classList.remove("theme-select")}
    y.currentTarget.classList.add("theme-select")
    document.body.setAttribute("data-theme", theme)
    localStorage.setItem("theme-select", `theme-${theme}`)
  }
  x.onkeyup = y => {
    if (y.code == "Space") {
      y.currentTarget.click()
    }
  }
})

/* MAIN MENU LANGUAGE */

const language = {
  as: {
    id: {
      name: "Indonesian",
      local: "Indonesian",
      code: "id",
      flag: "fi-id",
      translator: "tidakterdaftar"
    }
  },
  eu: {
    gb: {
      name: "English, GB",
      local: "English, GB",
      code: "en-GB",
      flag: "fi-gb",
      translator: "jamie"
    },
    pl: {
      name: "Polish",
      local: "Polskie",
      code: "pl",
      flag: "fi-pl",
      translator: "froq"
    }
  },
  na: {
    us: {
      name: "English, US",
      local: "English, US",
      code: "en-US",
      flag: "fi-us",
      translator: "cheese"
    }
  }
}

document.querySelector('[data-text-field="language"]').oninput = x => {
  var value = x.currentTarget.value.toLowerCase()
  document.querySelectorAll(".language-item").forEach(y => {
    if (y.textContent.toLowerCase().indexOf(value) >= 0) {
      y.removeAttribute("style")
    } else {
      y.style.display = "none"
    }
  })
  document.querySelectorAll(".language-label").forEach(y => {
    var contain = false
    for (let z of y.children) {
      if (z.classList[0] != "language-header") {
        if (z.style.display != "none") {
          contain = true
        }
      }
    }
    if (!contain) {
      y.style.display = "none"
    } else {
      y.removeAttribute("style")
    }
  })
  if (Array.from(document.querySelector(".language-content").children).filter(x => x.style.display != "none").length == 1) {
    document.querySelector('[data-empty="language"]').style.display = "block"
  } else {
    document.querySelector('[data-empty="language"]').removeAttribute("style")
  }
}

for (let x in language) {
  var string = {as: "Asia", eu: "Europe", na: "North America"}
  var label = document.createElement("div")
  label.className = "language-label"
  label.setAttribute("data-region", x)
  var header = document.createElement("span")
  header.className = "language-header"
  header.textContent = string[x]
  label.appendChild(header)
  for (let y in language[x]) {
    var item = document.createElement("div")
    if (localStorage.language == language[x][y].code || navigator.language == language[x][y].code) {
      item.className = "language-item language-select"
    } else {
      item.className = "language-item"
    }
    item.onclick = z => {
      var select = document.querySelector(".language-select")
      if (select) {select.classList.remove("language-select")}
      z.currentTarget.classList.add("language-select")
      localStorage.setItem("language", language[x][y].code)
    }
    item.onkeyup = z => {
      if (z.code == "Space") {
        z.currentTarget.click()
      }
    }
    item.setAttribute("tabindex", 0)
    var detail = document.createElement("span")
    detail.className = "language-detail"
    var local = document.createElement("span")
    local.className = "langauge-local"
    local.textContent = language[x][y].local
    detail.appendChild(local)
    var code = document.createElement("span")
    code.className = "language-code"
    code.textContent = language[x][y].code
    detail.appendChild(code)
    item.appendChild(detail)
    var extra = document.createElement("span")
    extra.className = "language-extra"
    var translator = document.createElement("span")
    translator.className = "language-translator"
    var avatar = document.createElement("img")
    avatar.src = chatango.subdomain.thumb_m(language[x][y].translator)
    avatar.alt = `${language[x][y].translator} profile picture`
    avatar.loading = "lazy"
    translator.appendChild(avatar)
    extra.appendChild(translator)
    var title = document.createElement("span")
    title.className = "language-title"
    title.textContent = language[x][y].name
    extra.appendChild(title)
    var flag = document.createElement("span")
    flag.className = `language-flag fi ${language[x][y].flag}`
    extra.appendChild(flag)
    item.appendChild(extra)
    label.appendChild(item)
  }
  document.querySelector('[data-option="language"]').querySelector(".language-content").appendChild(label)
}

document.querySelector('[data-advanced="language"]').onclick = x => {
  filterModal({
    id: "language",
    title: "Filter region",
    icon: "fa-globe",
    toggles: {
      Asia: {
        id: "as",
        on: true
      },
      Europe: {
        id: "eu",
        on: true
      },
      North_America: {
        id: "na",
        on: true
      }
    }
  })
  document.querySelector(".filter").classList.add("filter-view")
  document.querySelector(".filter-items").focus()
  document.querySelector(".filter-apply").onclick = () => {
    document.querySelector(".filter").classList.remove("filter-view")
    Array.from(document.querySelector(".filter-items").children).forEach(y => {
      var region = y.querySelector("input").getAttribute("data-filter-id")
      if (!y.querySelector("input").checked) {
        document.querySelector(`[data-region="${region}"]`).style.display = "none"
      } else {
        document.querySelector(`[data-region="${region}"]`).removeAttribute("style")
      }
    })
    if (Array.from(document.querySelector(".language-content").children).filter(x => x.style.display != "none").length == 1) {
      document.querySelector('[data-empty="language"]').style.display = "block"
    } else {
      document.querySelector('[data-empty="language"]').removeAttribute("style")
    }
  }
  if (x.currentTarget.getAttribute("data-filter-first") != 1) {
    x.target.setAttribute("data-filter-first", 1)
    var reset = Array.from(document.querySelector(".filter-items").cloneNode(true).children).map(y => y.querySelector("input").checked)
    document.querySelector(".filter-reset").onclick = () => {
      document.querySelector(".filter-items").focus()
      Array.from(document.querySelector(".filter-items").children).forEach((y, z) => {
        if (y.querySelector("input").checked != reset[z]) {
          y.querySelector("input").click()
        }
      })
    }
  }
}

/* MAIN MENU ACCESSIBILITY */

document.querySelector('[data-change="transition-time"]').nextElementSibling.onchange = function() {
  document.querySelector(":root").style.setProperty("--element-transition", `${document.querySelector('[data-change="transition-time"]').nextElementSibling.value}s`)
}

document.querySelectorAll(".ease-switch").forEach(x => {
  if (x.parentNode.previousElementSibling) {
    var change = x.parentNode.previousElementSibling.getAttribute("data-change")
    var value = x.parentNode.previousElementSibling.getAttribute("data-value")
    var pattern = RegExp(`${change}\\(.*?\\)`, "g")
  } else {
    var change = false
    var value = false
    var pattern = false
  }
  x.previousElementSibling.onchange = function() {
    var check = document.documentElement.style.filter.includes(change)
    if (this.checked) {
      if (change == "transition") {
        var style = document.querySelector(".transition-cancel")
        if (style) {style.remove()}
      } else {
        if (check) {document.documentElement.style.filter = document.documentElement.style.filter.replace(pattern, `${change}(${value})`)}
        else {document.documentElement.style.filter += `${change}(${value})`}
      }
    } else {
      if (change == "transition") {
        var style = document.createElement("style")
        style.className = "transition-cancel"
        style.innerHTML = "* {transition: none !important}"
        document.querySelector("head").appendChild(style)
      } else {
        if (check) {document.documentElement.style.filter = document.documentElement.style.filter.replace(pattern, "")}
      }
    }
  }
})

document.querySelectorAll(".ease-range-wrapper").forEach((x, y) => {
  var rangeMaximum = x.getAttribute("data-max") ? x.getAttribute("data-max"): 100
  if (x.previousElementSibling) {
    var change = x.previousElementSibling.getAttribute("data-change")
    var pattern = RegExp(`${change}\\(.*?\\)`, "g")
  }
  var range = document.createElement("input")
  range.type = "range"
  range.step = x.getAttribute("data-step") ? x.getAttribute("data-step"): 5
  range.min = 0
  range.max = rangeMaximum
  range.value = x.getAttribute("data-value") ? x.getAttribute("data-value"): 0
  range.setAttribute("list", `placemark-${y}`)
  range.oninput = function() {
    number.value = this.value
    if (x.previousElementSibling) {
      var check = document.documentElement.style.filter.includes(change)
      if (check) {document.documentElement.style.filter = document.documentElement.style.filter.replace(pattern, `${change}(${this.value}%)`)}
      else {document.documentElement.style.filter += `${change}(${this.value}%)`}
    }
  }
  range.className = "ease-range"
  x.appendChild(range)
  var number = document.createElement("input")
  number.type = "number"
  number.min = 0
  number.max = rangeMaximum
  number.value = x.getAttribute("data-value") ? x.getAttribute("data-value"): 0
  if (x.getAttribute("data-name")) {
    number.name = x.getAttribute("data-name")
  }
  number.className = "ease-number"
  /*
  number.oninput = function() {
    if (this.value > rangeMaximum) {
     this.value = rangeMaximum
    }
    range.value = this.value
    var check = document.documentElement.style.filter.includes(change)
    if (check) {document.documentElement.style.filter = document.documentElement.style.filter.replace(pattern, `${change}(${this.value}%)`)}
    else {document.documentElement.style.filter += `${change}(${this.value}%)`}
  }
  */
  x.appendChild(number)
  var placemark = document.createElement("datalist")
  placemark.id = `placemark-${y}`
  for (var z = 0; z <= rangeMaximum; z++) {
    if (z % Math.round(rangeMaximum * 0.1) == 0) {
      var option = document.createElement("option")
      option.value = z
      if (z % Math.round(rangeMaximum * 0.5) == 0) {option.label = `${z}%`}
      placemark.appendChild(option)
    }
  }
  x.appendChild(placemark)
})

document.querySelectorAll(".ease-number").forEach(x => {
  var minimum = x.min || 0
  var maximum = x.max || 100
  x.oninput = y => {
    var number = parseInt(y.currentTarget.value)
    if (number < minimum) {
      x.value = minimum
    }
    if (number > maximum) {
      x.value = maximum
    }
    var range = x.previousElementSibling
    if (range && range.type == "range") {
      range.value = x.value
    }
    var change = x.parentNode.previousElementSibling
    if (change && change.getAttribute("data-change")) {
      var value = change.getAttribute("data-change")
      var pattern = RegExp(`${change}\\(.*?\\)`, "g")
      var check = document.documentElement.style.filter.includes(value)
      if (check) {
        document.documentElement.style.filter = document.documentElement.style.filter.replace(pattern, `${change}(${this.value}%)`)
      } else {
        document.documentElement.style.filter += `${change}(${this.value}%)`
      }
    }
  }
})

/* MAIN MENU FAQ */

const qna = {
  q1: {
    ask: "Why should I use the client?",
    tag: ["client"],
    answer: "The client fixes bugs that Chatango still has and adds many additional features such as the ability to reply to messages, blocking users in groups, restoration of old profile displays prior to flash and more."
  },
  q2: {
    ask: "Does the client work on mobile?",
    tag: ["mobile"],
    answer: "Yes but it is not fully optimized yet."
  },
  q3: {
    ask: "How do I use the client?",
    tag: ["client"],
    answer: "Check our help center for more details on specific aspects. If a resource you are looking for is not available, feel free to contact us through our socials."
  },
  q4: {
    ask: "Can I get banned from Chatango for using the client?",
    tag: ["client"],
    answer: "Chatango does not state anything about prohibiting accessing its services via a third party. As bots are allowed, despite no official regulation or API, we assume the client would be too."
  },
  q5: {
    ask: "Can I trust the client?",
    tag: ["safety"],
    answer: "Your account details may be stored and encrypted on our own servers to keep you logged in and to allow account switching but is held privately and inaccessible. Hashing, the more secure method to store login data, is not possible due to the current way Chatango handles group logins."
  },
  q6: {
    ask: "How do I delete all messages from a user in a group?",
    tag: ["moderation"],
    answer: "Hold shift while hovering over a message and click the delete icon. On mobile, press and hold a message to view more options."
  }
}

document.querySelector('[data-option="faq"]').querySelector(".modal-content").onkeydown = x => {
  if (document.activeElement.tagName != "INPUT" && x.code == "Space") {
    x.preventDefault()
  }
}

document.querySelector('[data-text-field="question"]').oninput = x => {
  var value = x.currentTarget.value.toLowerCase()
  document.querySelectorAll(".faq-question").forEach(y => {
    if (y.textContent.toLowerCase().indexOf(value) >= 0) {y.parentNode.style.display = "block"}
    else {y.parentNode.style.display = "none"}
  })
}

for (let x in qna) {
  var item = document.createElement("div")
  item.className = "faq-item"
  item.setAttribute("tabindex", 0)
  item.onclick = function() {
    var selected = document.querySelector('[data-option="faq"]').querySelector(".faq-select")
    var change = this.querySelector(".faq-collapse").classList
    var collapsed = change.contains("fa-chevron-up")
    if (collapsed) {
      change.remove("faq-select")
      change.remove("fa-chevron-up")
      this.querySelector(".faq-answer").style.display = "none"
      if (selected) {
        selected.classList.remove("faq-select")
        selected.classList.remove("fa-chevron-up")
        selected.parentNode.querySelector(".faq-answer").style.display = "none"
      }
    } else {
      change.add("faq-select")
      change.add("fa-chevron-up")
      this.querySelector(".faq-answer").style.display = "block"
      if (selected) {
        selected.classList.remove("faq-select")
        selected.classList.remove("fa-chevron-up")
        selected.parentNode.querySelector(".faq-answer").style.display = "none"
      }
    }
  }
  item.onkeyup = y => {
    if (y.code == "Space") {
      y.currentTarget.click()
    }
  }
  var question = document.createElement("div")
  question.className = "faq-question"
  question.textContent = qna[x].ask
  item.appendChild(question)
  var collapse = document.createElement("span")
  collapse.className = "faq-collapse fa-solid fa-chevron-down"
  item.appendChild(collapse)
  var category = document.createElement("div")
  category.className = "faq-category"
  qna[x].tag.forEach(y => {
    var tag = document.createElement("div")
    tag.className = "faq-tag"
    tag.textContent = y
    category.appendChild(tag)
  })
  item.appendChild(category)
  var answer = document.createElement("div")
  answer.className = "faq-answer"
  answer.textContent = qna[x].answer
  item.appendChild(answer)
  document.querySelector('[data-option="faq"]').querySelector(".modal-content").appendChild(item)
}

document.querySelector('[data-advanced="question"]').onclick = x => {
  filterModal({
    id: "question",
    title: "Filter tags",
    icon: "fa-clipboard-list",
    toggles: {
      General: {
        id: "general",
        on: true
      },
      Client: {
        id: "client",
        on: true
      },
      Mobile: {
        id: "mobile",
        on: true
      },
      Safety: {
        id: "safety",
        on: true
      },
      Moderation: {
        id: "moderation",
        on: true
      },
      Group: {
        id: "group",
        on: true
      }
    }
  })
  document.querySelector(".filter").classList.add("filter-view")
  document.querySelector(".filter-items").focus()
  document.querySelector(".filter-apply").onclick = () => {
    document.querySelector(".filter").classList.remove("filter-view")
    Array.from(document.querySelector(".filter-items").children).forEach(y => {
      var category = y.querySelector("input").getAttribute("data-filter-id")
      document.querySelectorAll(".faq-category").forEach(z => {
        if (z.textContent.includes(category) && !y.querySelector("input").checked) {
          z.parentNode.style.display = "none"
        } else {
          z.parentNode.removeAttribute("style")
        }
      })
    })
  }
  if (x.currentTarget.getAttribute("data-filter-first") != 1) {
    x.target.setAttribute("data-filter-first", 1)
    var reset = Array.from(document.querySelector(".filter-items").cloneNode(true).children).map(y => y.querySelector("input").checked)
    document.querySelector(".filter-reset").onclick = () => {
      document.querySelector(".filter-items").focus()
      Array.from(document.querySelector(".filter-items").children).forEach((y, z) => {
        if (y.querySelector("input").checked != reset[z]) {
          y.querySelector("input").click()
        }
      })
    }
  }
}

/* MAIN MENU CREDITS */

/*
This project is to be maintained by volunteering individuals who take
pride and genuinely care in shaping the platform to its full potential.
At the same time, creating an environment that's nostalgic yet familiar.
Those who have spent their time on the site wishing there could be
something more can now make a difference here with us by contributing.

PC & Mobile (Full)
Bulma
Hellhound
Lavell

PC (3 slots)

Mobile (1 slot)
Heartbeat
T
*/

const credits = [
  {
    name: "Cheese",
    role: "Programmer",
    title: "Full Stack Developer",
    description: "The developer of The Droid Project and founder of The Torch Client.",
    social: {
      url: "https://vissle.me/",
      github: "https://github.com/Vissle-Drissle"
    }
  },
  {
    name: "Lethe",
    role: "Programmer",
    title: "Security Developer",
    description: "Original developer of the Chatango bot, Lethebot.",
    social: false,
  },
  {
    name: "Jack",
    role: "Programmer",
    title: "Mobile Developer",
    description: "Software engineer.",
    social: false
  },
  {
    name: "Hazerd",
    role: "Artist",
    title: "Graphic Designer",
    description: "The founder and previous maintainer of The Droid Project, created the profile picture for Droid.",
    social: {
      url: "https://hazerd.com/"
    }
  },
  {
    name: "Jamie",
    role: "Designer",
    title: "UI & UX Designer",
    description: "The designer and advisor for The Torch Client.",
    social: {
      url: "https://brickjoke.com/"
    }
  },
  { // tidakterdaftar or zavents
    name: "Fath",
    role: "Translator",
    title: "Indonesian Translator",
    description: "A translator for the Indonesian language.",
    social: false
  },
  { // poker
    name: "6",
    role: "Translator",
    title: "Spanish Translator",
    description: "A translator for the Spanish language.",
    social: false
  },
  { // wish
    name: "Soleil",
    role: "Translator",
    title: "French Translator",
    description: "A translator for the French language.",
    social: false
  },
  {
    name: "Bulma",
    role: "QA Tester",
    title: "PC Tester",
    description: "A beta tester for The Torch Client.",
    social: {
      url: "https://bulma.cc/"
    }
  },
  {
    name: "Hellhound",
    role: "QA Tester",
    title: "PC Tester",
    description: "A beta tester for The Torch Client.",
    social: false
  },
  {
    name: "Heartbeat",
    role: "QA Tester",
    title: "PC Tester",
    description: "A beta tester for The Torch Client.",
    social: false
  },
  {
    name: "Tips",
    role: "QA Tester",
    title: "PC Tester",
    description: "A beta tester for The Torch Client.",
    social: false
  },
  {
    name: "Hardware",
    role: "Inspiration",
    title: "Thank You",
    description: "Original developer of the Chatango bot, Software.",
    social: false,
    note: "No amount of words could describe how much you have influenced me as a programmer, thank you."
  },
  {
    name: "Barry",
    role: "Inspiration",
    title: "Thank You",
    description: "Original author of the derplib.js Chatango library and developer of the Chatango bot, B0t.",
    social: {
      github: "https://github.com/MakuraYami"
    },
    note: "It's great to see one of the oldest bots still active."
  },
  {
    name: "Pichu",
    role: "Inspiration",
    title: "Thank You",
    description: "Original author of the coco.js Chatango library and developer of the Chatango bot, Bros.",
    social: {
      github: "https://github.com/piks"
    },
    note: "Thank you for still being around and interacting with the community."
  },
  {
    name: "Lumi",
    role: "Inspiration",
    title: "Thank You",
    description: "Original author of the ch.py Chatango library and co-developer of the Chatango bot, Botteh.",
    social: {
      github: "https://github.com/lumirayz"
    },
    note: "You may hate it and it brought upon the age of copy and pasting, but I see it as a way others can learn. Multiple variants and modifications to rewrite or improve, a simple experiment to understand Chatango websockets can go on to create wonderful things."
  },
  {
    name: "Coil",
    role: "Inspiration",
    title: "Thank You",
    description: "Original author of the cherryblossom.py Chatango library and developer of the Chatango bot, Intellect.",
    social: {
      github: "https://github.com/Sweets"
    },
    note: "I hope you're doing well."
  },
  {
    name: "Herenti",
    role: "Inspiration",
    title: "Thank You",
    description: "Original author of the cakelib2.py Chatango library.",
    social: {
      github: "https://github.com/herenti"
    }
  }
]

var creditor = Object.keys(credits)

credits.forEach((x, y) => {
  var title = x.title
  var credit = document.querySelector(`[data-credits="${title}"]`)
  if (!credit) {
    var due = document.createElement("div")
    due.className = "credits-wrapper"
    due.setAttribute("data-credits", title)
    y % 2 == 0 ? due.style.textAlign = "left": due.style.textAlign = "right"
    var position = document.createElement("span")
    position.className = "credits-title"
    position.textContent = title
    due.appendChild(position)
    document.querySelector(".credits-team").appendChild(due)
  }
  var label = document.createElement("div")
  label.className = y % 2 == 0 ? "credits-label": "credits-label credits-label-reverse"
  var user = document.createElement("figure")
  user.className = "credits-user"
  var avatar = document.createElement("img")
  avatar.className = "credits-avatar"
  avatar.src = chatango.subdomain.thumb_m(x.name)
  avatar.alt = `${x.name} profile picture`
  avatar.loading = "lazy"
  user.appendChild(avatar)
  var team = document.createElement("figcaption")
  team.className = "credits-member"
  team.textContent = x.name
  user.appendChild(team)
  label.appendChild(user)
  var role = document.createElement("span")
  role.className = "credits-role"
  role.textContent = x.role
  label.appendChild(role)
  var description = document.createElement("div")
  description.className = "credits-description"
  description.textContent = x.description
  if (x.social) {
    var social = document.createElement("span")
    social.className = "credits-social"
    for (let z in x.social) {
      var url = document.createElement("a")
      url.className = "credits-link"
      url.href = x.social[z]
      url.target = "_blank"
      var icon = document.createElement("span")
      switch (z) {
        case "url":
          icon.className = "credits-link-icon fa-solid fa-link"
          break;
        case "github":
          icon.className = "credits-link-icon fa-brands fa-github"
          break;
      }
      url.appendChild(icon)
      var link = document.createElement("span")
      link.textContent = x.social[z]
      url.appendChild(link)
      social.appendChild(url)
    }
    description.appendChild(social)
  }
  label.appendChild(description)
  document.querySelector(`[data-credits="${title}"]`).appendChild(label)
})

/* APPLICATION FUNCTIONS */

const torch = {
  host: "vissle.me/".slice(0, -1),
  domain: "https://vissle.me/".slice(0, -1),
  static: "https://vissle.me/".slice(0, -1),
  mirror: ["vissle.me/".slice(0, -1), "dev.vissle.me"],
  crossBrowser: navigator.userAgent.includes("Firefox") ? "true": "plaintext-only",
  //server: "higjfiwjge",
  server: "gebuvhoia",
  environment: "env",
  groups: {},
  avatar: {
    fire: {
      icon: "fa-solid fa-fire",
      color: "var(--theme-highlight)"
    },
    invalid: {
      icon: "fa-solid fa-user-question",
      color: "var(--theme-text-description)"
    },
    spinner: {
      icon: "fa-solid fa-spinner",
      color: "var(--theme-text-title)"
    },
    terminal: {
      icon: "fa-solid fa-terminal",
      color: "var(--theme-text-description)"
    },
    check: {
      icon: "fa-solid fa-check",
      color: "var(--theme-active)"
    },
    x: {
      icon: "fa-solid fa-x",
      color: "var(--theme-highlight)"
    },
    eye: {
      icon: "fa-solid fa-eye",
      color: "var(--theme-passive)",
      size: 38
    },
    online: {
      icon: "fa-solid fa-signal",
      color: "var(--theme-active)",
      size: 35
    },
    "online app": {
      icon: "fa-solid fa-mobile-screen",
      color: "var(--theme-active)"
    },
    app: {
      icon: "fa-solid fa-mobile-screen",
      color: "var(--brand-chatango)"
    },
    idle: {
      icon: "fa-solid fa-moon",
      color: "var(--theme-passive)"
    },
    offline: {
      icon: "fa-solid fa-power-off",
      color: "var(--theme-highlight)"
    },
    blocked: {
      icon: "fa-solid fa-user-slash",
      color: "var(--theme-text-description)",
      size: 35
    },
    ignored: {
      icon: "fa-solid fa-eye-slash",
      color: "var(--theme-text-description)"
    }
  }
}

class Client {
  constructor() {
    this.version = {
      number: "0.1.0-b",
      major: "0",
      minor: "1",
      patch: "0"
    },
    this.events = {}
    this.groups = {}
    this.token = false
    this.database = {
      pm: false,
      media: false
    }
    this.user = {
      name: false,
      background: false,
      style: false,
      pmr: false,
      away: {
        enable: false,
        message: false,
        timeout: false,
        friendsOnly: false,
        sent: []
      },
      profile: {},
      avatar: {}
    }
    this.cache = {
      previous: false,
      bots: {
        detect: [],
        verified: []
      },
      listen: [],
      contributors: [],
      media: {},
      avatar: [],
      blacklist: {
        background: [],
        style: []
      },
      connect: [],
      overload: [],
      wait: {
        mini: [],
        premium: [],
        media: {}
      },
      queue: {
        mini: {},
        premium: {}
      },
      background: {},
      youtube: {},
      profile: {},
      whitelist: ["chatango.com"],
      interval: {},
      cooldown: {
        console: 0
      }
    }
    this.focus = "community"
    this.private = false
    this.frame = {
      blocklist: [],
      modactions: []
    }
    this.event = {
      group: {
        reload: function(client, socket, room, data) {
          console.log("onReload")
        },
        denied: function(client, socket, room, data) {
          console.log("onDenied")
        },
        ok: function(client, socket, room, data) {
          var connection = document.querySelector(`.sidebar-group-error[data-group="${room}"]`)
          if (connection) {
            connection.classList.remove("sidebar-group-error")
          }
          if (!(room in torch.groups)) {
            torch.groups[room] = {}
          }
          var content = {
            badge: 0,
            channel: {
              select: 0,
              filtered: []
            },
            input: {},
            premium: {},
            message: "",
            moderator: false
          }
          var item = {
            flag: [],
            name: room,
            time: (+data[4] * 1000) - Date.now(),
            owner: data[0],
            init: false,
            missed: false,
            character: 2900,
            information: {
              title: room[0].toUpperCase() + room.slice(1),
              description: "No description",
              original: {}
            },
            moderator: {},
            queue: {},
            banned: {
              member: [],
              word: {
                partial: [],
                exact: []
              }
            }
          }
          for (let x in chatango.flags.group) {
            var find = x & parseInt(data[7])
            if (find) {
              item.flag.push(chatango.flags.group[x])
              if (chatango.flags.group[x] == "NO_REPETITION") {
                item.character = 850
              }
            }
          }
          if (data[6].length > 0) {
            if (client.user.name != data[0]) {
              content.moderator = true
            }
            var moderator = data[6].split(";")
            var staff = {}
            moderator.forEach(x => {
              var names = x.split(",")
              var user = names[0]
              if (user.length && user != data[0]) {
                var level = []
                for (let x in chatango.flags.moderator) {
                  var find = x & parseInt(names[1])
                  if (find) {
                    level.push(chatango.flags.moderator[x])
                  }
                }
                staff[user] = level
              }
            })
            item.moderator = staff
          }
          fetch(chatango.subdomain.gprofile(room)).then(async response => {
            var content = await response.text()
            var gprofile = new DOMParser()
            var information = gprofile.parseFromString(content, "text/xml")
            var title = information.querySelector("title")
            if (title) {
              var text = decodeURIComponent(title.innerHTML)
              if (text.trim().length > 0) {
                item.information.title = text
              }
              item.information.original.title = text
            }
            var description = information.querySelector("desc")
            if (description) {
              var text = decodeURIComponent(description.innerHTML)
              if (text.trim().length > 0) {
                item.information.description = text
                if (client.focus == room) {
                  document.querySelector(".server-description").textContent = text
                  var preload = document.querySelector('[data-window="information"]')
                  if (preload) {
                    preload.querySelector('[data-page="Information"]').textContent = text
                  }
                }
              }
              item.information.original.description = text
            }
          }).catch(error => {
            console.log(error)
          })
          var group = new Group({packet: item, content: content}, socket)
          if (client.focus == room) {
            Array.from(["owner", "administrator", "moderator", "user", "bot", "guest"]).forEach(x => {
              document.querySelector(`[data-role="${x}"]`).replaceChildren()
            })
            sidebar.renderPerson({username: data[0], role: "owner", status: "offline"})
            document.querySelector(".server-title").textContent = item.information.title
            document.querySelector(".server-description").textContent = item.information.description
            client.setConnect({icon: "spinner", content: "Connecting..."})
            if (item.flag.indexOf("IS_CLOSED") >= 0) {
              client.setPlaceholder({enable: "false", content: `#${room} is closed`, clear: true})
            } else if (item.flag.indexOf("BROADCAST_MODE") >= 0) {
              var moderator = content.moderator && client.user.name in item.moderator && item.moderator[client.user.name].indexOf("CAN_BROADCAST") >= 0
              if (client.user.name == item.owner || moderator) {
                client.setPlaceholder({enable: torch.crossBrowser, content: `Broadcast to #${room}`, focus: true})
              } else {
                client.setPlaceholder({enable: "false", content: `#${room} is in broadcast mode`, clear: true})
              }
            } else {
              client.setPlaceholder({enable: torch.crossBrowser, content: `Message in #${room}`, focus: true})
            }
          }
          client.groups[room] = group
          client.emit("groupConnect", group)
        },
        i: function(client, socket, room, data) {
          var flags = []
          for (let x in chatango.flags.message) {
            var find = x & parseInt(data[7])
            if (find) {
              flags.push(chatango.flags.message[x])
            }
          }
          var identifier = data[9].match(/<n(\d+)\/>/) || [0, 3452]
          var item = {username: data[1] || (data[2] ? "#" + data[2]: "") || chatango.getAnon(data[3], identifier[1]), group: room, timestamp: data[0], content: data.slice(9).join(":"), session: data[4], key: data[5], ip: data[6], flag: flags, command: "i", position: "afterbegin", node: true}
          var message = client.renderMessage(item)
          if (client.focus == room) {
            if (client.groups[room].ready == "wait" && client.groups[room].load == 0) {
              client.groups[room].load += 1
              client.renderMessage({content: "Previous messages above", banner: true, unique: "previous", position: "afterbegin"})
            } else if (client.groups[room].ready) {
              client.groups[room].load += 1
            }
            document.querySelector(".application-chat-wrapper").insertAdjacentElement("afterbegin", message)
            if (client.groups[room].room.missed && client.settings.notifications.display.new_message) {
              var old = client.groups[room].room.missed
              if (data[5] == old) {
                client.groups[room].room.missed = false
                client.renderMessage({content: "New messages", banner: true, position: "afterbegin"})
                var find = document.querySelector(".application-chat-wrapper").querySelector(".chat-banner-item")
                if (find) {
                  setTimeout(() => {
                    find.scrollIntoView({behavior: "smooth", block: "nearest"})
                  }, 1000)
                }
              }
            }
          } else if (room == torch.environment) {
            if (data[1].toLowerCase() == "client") {
              client.setEnvironment(data[9], data[10])
            }
          }
        },
        inited: async function(client, socket, room, data) {
          socket.send("getpremium\r\n")
          if (client.focus == room) {
            if (client.cache.overload.indexOf(room) >= 0) {
              socket.send("gparticipants\r\n")
            } else {
              socket.send("g_participants:start\r\n")
            }
          }
          setTimeout(() => {
            if (client.cache.connecting == room) {
              if (!client.groups[room].ready) {
                client.cache.overload.push(room)
                client.disconnectFrom(group, false, true)
                client.setNotice({
                  enable: true,
                  icon: "warning",
                  color: "var(--theme-highlight)",
                  content: `#${room} has a lot of users`,
                  button: "Continue",
                  action: x => {
                    client.connect(room).then(socket => {
                      client.cache.connect = client.cache.connect.filter(x => x != room)
                      client.setConnect({icon: "spinner", content: "Connecting..."})
                      client.setFocus({group: room, reload: true, force: true})
                    }).catch(error => {
                      client.cache.connect = client.cache.connect.filter(x => x != room)
                      client.setConnect({icon: "spinner", content: "Connecting..."})
                      client.systemMessage({content: error})
                    })
                  }
                })
              }
            }
          }, 2000)
        },
        n: function(client, socket, room, data) {
          //document.querySelector(".application-connect").classList.add("display-none")
          //document.querySelector(".application-content").classList.remove("display-none")
          //document.querySelector(".application-sidebar").removeAttribute("data-disable")
          if (client.focus == room && !client.groups[room].init) {
            client.groups[room].init = true
            client.setFocus({group: room, init: true})
          }
          if (room == client.cache.connecting) {
            client.cache.connecting = false
          }
        },
        nomore: function(client, socket, room, data) {
          if (client.focus == room) {
            client.renderMessage({content: "This is the beginning of this group", banner: true, unique: "begin", position: "afterbegin"})
          }
          client.groups[room].load = -1
        },
        gotmore: function(client, socket, room, data) {
          if (client.focus == room) {
            if (client.groups[room].load != -1) {
              client.groups[room].load = parseInt(data[0]) + 1
              client.groups[room].ready = true
            }
          }
        },
        mtoken: function(client, socket, room, data) { //getmtoken
          console.log(data)
          //socket.send("msgmedia:1\r\n")
        },
        premium: function(client, socket, room, data) {
          var status = client.user.name == client.groups[room].room.owner || ["200", "210"].includes(data[0])
          if (client.user.background && status) {
            socket.send("msgbg:1\r\n")
          }
          client.groups[room].user.premium = {
            status: +data[0],
            timestamp: +data[1]
          }
          if (room == torch.environment) {
            var expire = (data[1] * 1000 - Date.now()) / 1000
            var day = 60 * 60 * 24 * 3
            if (expire > 0) {
              client.displayEpoch({time: data[1], reverse: true, alert: true})
            }
            if (expire > day) {
              setTimeout(() => {
                client.displayEpoch({time: data[1], reverse: true, alert: true})
              }, ((Date.now() / 1000) - +data[1] - day) * 1000)
              setTimeout(() => {
                client.setNotice({icon: "star", color: "var(--brand-chatango)", content: "Your Chatango Premium has expired."})
              }, expire * 1000)
            }
          }
        },
        b: function(client, socket, room, data) { // g_flag:${key} - getnotifysettings (notifysettings:email@mail.com:0:0:0) - setnotifysettings:email@mail.com:password:1:1:1 - checkemail_notify:email@mail.com
          var key = data[5]
          var flags = []
          for (let x in chatango.flags.message) {
            var find = x & parseInt(data[7])
            if (find) {
              flags.push(chatango.flags.message[x])
            }
          }
          var target = document.querySelector(".application-sidebar-content").querySelector(`[data-group="${room}"]`)
          var identifier = data[9].match(/<n(\d+)\/>/) || [0, 3452]
          var item = {username: data[1] || (data[2] ? "#" + data[2]: "") || chatango.getAnon(data[3], identifier[1]), group: room, timestamp: data[0], content: data.slice(9).join(":"), session: data[4], ip: data[6], flag: flags, command: "b", position: "beforeend", node: true}
          if (key in client.groups[room].room.queue) {
            item.key = client.groups[room].room.queue[key]
            delete client.groups[room].room.queue[key]
            var message = client.renderMessage(item)
            if (client.focus == room) {
              document.querySelector(".application-chat-wrapper").insertAdjacentElement("beforeend", message)
            } else if (target && client.settings.notifications.display.new_bubble) {
              var previous = target.parentNode.getAttribute("data-amount")
              if (previous == 0) {
                target.parentNode.classList.add("sidebar-group-notify")
              }
              var amount = parseInt(previous) + 1
              if (amount > 99) {
                target.parentNode.setAttribute("data-amount", "99+")
              } else {
                target.parentNode.setAttribute("data-amount", amount)
              }
            }
          } else {
            client.groups[room].room.queue[key] = item
          }
          if (room == torch.environment) {
            if (data[1].toLowerCase() == "client") {
              client.setEnvironment(data[9], data[10])
            }
          }
        },
        u: function(client, socket, room, data) {
          var key = data[0]
          if (key in client.groups[room].room.queue) {
            var message = client.groups[room].room.queue[key]
            message.key = data[1]
            message.command = "u"
            delete client.groups[room].room.queue[key]
            var item = client.renderMessage(message)
            if (client.focus == room) {
              document.querySelector(".application-chat-wrapper").insertAdjacentElement("beforeend", item)
            } else {
              if (!client.groups[room].room.missed) {
                client.groups[room].room.missed = data[1]
              }
              var target = document.querySelector(".application-sidebar-content").querySelector(`[data-group="${room}"]`)
              if (target && client.settings.notifications.display.new_bubble) {
                var previous = target.parentNode.getAttribute("data-amount")
                if (previous == 0) {
                  target.parentNode.classList.add("sidebar-group-notify")
                }
                var amount = parseInt(previous) + 1
                if (amount > 99) {
                  target.parentNode.setAttribute("data-amount", "99+")
                } else {
                  target.parentNode.setAttribute("data-amount", amount)
                }
              }
            }
          } else {
            client.groups[room].room.queue[key] = data[1]
          }
        },
        g_participants: function(client, socket, room, data) {
          if (client.cache.connecting == room) {
            client.cache.connecting = false
          }
          if (client.focus == room) {
            client.groups[room].ready = true
            var member = data.join(":").split(";")
            sidebar.parseParticipant(member)
          }
        },
        gparticipants: function(client, socket, room, data) {
          if (room == client.cache.connecting) {
            client.cache.connecting = false
          }
          if (client.focus == room) {
            var guest = data[0]
            client.groups[room].ready = true
            var overload = data.slice(1).join(":").split(";")
            sidebar.parseParticipant(overload)
          }
        },
        participant: function(client, socket, room, data) {
          if (client.focus == room || document.querySelector('.sidebar-people[data-people="members"]').getAttribute("data-group") == room) {
            var member = data[3].toLowerCase()
            var guest = "#" + data[4].toLowerCase()
            var timestamp = document.querySelector(`[data-timestamp="${data[6]}"]`)
            if (data[0] == 0) {
              if (member == client.groups[room].room.owner) {
                var owner = document.querySelector(`[data-target="${member}"]`)
                if (owner) {
                  owner.removeAttribute("data-timestamp")
                  owner.setAttribute("data-target", member)
                  owner.setAttribute("data-status", "offline")
                  client.emit("memberLeave", data[3])
                }
              } else if (timestamp) {
                var target = timestamp.getAttribute("data-target")
                if (member == target.toLowerCase() || guest == target.toLowerCase() || chatango.getAnon(data[2], data[6]) == target) {
                  timestamp.remove()
                  client.emit(member == target.toLowerCase() ? "memberLeave": "anonLeave", target)
                }
             }
            } else if (data[0] == 1) {
              if (member == client.groups[room].room.owner) {
                var owner = document.querySelector(`[data-target="${member}"]`)
                if (owner) {
                  owner.setAttribute("data-timestamp", data[6])
                  owner.setAttribute("data-target", data[3])
                  owner.setAttribute("data-status", "online")
                  owner.querySelector(".sidebar-user-name").textContent = data[3]
                  client.emit("memberJoin", data[3])
                }
              } else if (data[3] != "None") {
                if (client.cache.bots.verified.indexOf(member) >= 0) {
                  sidebar.renderPerson({username: data[3], sensitive: true, role: "bot", timestamp: data[6]})
                } else if (member in client.groups[room].room.moderator) {
                  var administrator = client.groups[room].room.moderator[member].some(x => chatango.flags.administrator.includes(x))
                  if (administrator) {
                    sidebar.renderPerson({username: data[3], sensitive: true, role: "administrator", timestamp: data[6]})
                  } else {
                    sidebar.renderPerson({username: data[3], sensitive: true, role: "moderator", timestamp: data[6]})
                  }
                } else {
                  sidebar.renderPerson({username: data[3], sensitive: true, role: "user", timestamp: data[6]})
                }
                client.emit("memberJoin", data[3])
              } else {
                sidebar.renderPerson({username: chatango.getAnon(data[2], data[6]), sensitive: true, role: "guest", timestamp: data[6]})
                client.emit("anonJoin", chatango.getAnon(data[2], data[6]))
              }
            } else if (data[0] == 2) {
              if (data[4] != "None") {
                if (timestamp) {
                  var target = timestamp.getAttribute("data-target")
                  if (chatango.getAnon(data[2], data[6]) == target) {
                    timestamp.remove()
                  }
                }
                client.emit("anonName", {before: chatango.getAnon(data[2], data[6]), after: data[4]})
                sidebar.renderPerson({username: `#${data[4]}`, sensitive: true, role: "guest", timestamp: data[6]})
              } else if (data[3] == "None") {
                if (timestamp) {
                  var target = timestamp.getAttribute("data-target")
                  if (target.toLowerCase() == client.groups[room].room.owner) {
                    timestamp.removeAttribute("data-timestamp")
                    timestamp.setAttribute("data-target", client.groups[room].room.owner)
                    timestamp.setAttribute("data-status", "offline")
                  } else {
                    timestamp.remove()
                  }
                  sidebar.renderPerson({username: chatango.getAnon(data[2], data[6]), sensitive: true, role: "guest", timestamp: data[6], previous: target})
                  client.emit("memberLogout", {before: target, after: chatango.getAnon(data[2], data[6])})
                }
              } else {
                if (timestamp) {
                  var previous = timestamp.getAttribute("data-previous")
                  if (previous) {
                    if (previous != data[3]) {
                      client.emit("memberSwitch", {before: previous, after: data[3]})
                    } else {
                      client.emit("memberChange", {before: previous, after: data[3]})
                    }
                  } else {
                    client.emit("memberLogin", {before: chatango.getAnon(data[2], data[6]), after: data[3]})
                  }
                }
                if (member == client.groups[room].room.owner) {
                  var owner = document.querySelector(`[data-target="${member}"]`)
                  if (owner) {
                    owner.setAttribute("data-timestamp", data[6])
                    owner.setAttribute("data-target", data[3])
                    owner.setAttribute("data-status", "online")
                    owner.querySelector(".sidebar-user-name").textContent = data[3]
                  }
                } else if (member in client.groups[room].room.moderator) {
                  var administrator = client.groups[room].room.moderator[member].some(x => chatango.flags.administrator.includes(x))
                  if (administrator) {
                    sidebar.renderPerson({username: data[3], sensitive: true, role: "administrator", timestamp: data[6]})
                  } else {
                    sidebar.renderPerson({username: data[3], sensitive: true, role: "moderator", timestamp: data[6]})
                  }
                } else {
                  sidebar.renderPerson({username: data[3], sensitive: true, role: "user", timestamp: data[6]})
                }
                if (timestamp) {
                  timestamp.remove()
                }
              }
            }
            if (data[3] != "None") {
              var dupe = document.querySelectorAll(`.sidebar-people[data-people="members"] .sidebar-user-item[data-target="${member}" i]`)
              if (dupe.length > 1) {
                var timestamped = Array.from(dupe).map(x => Number(x.getAttribute("data-timestamp")))
                var oldest = Math.min(...timestamped)
                var instance = Array.from(dupe).filter(x => x.getAttribute("data-timestamp") == oldest)
                dupe.forEach(x => {
                  var ts = x.getAttribute("data-timestamp")
                  if (instance.length && x == instance[0] && ts == oldest) {
                    x.setAttribute("data-dupe", dupe.length)
                    x.removeAttribute("style")
                  } else {
                    x.style.display = "none"
                  }
                })
              } else if (dupe.length == 1 && member != torch.groups[room].uid) {
                dupe[0].removeAttribute("data-dupe")
                dupe[0].removeAttribute("style")
              }
            }
          }
        },
        delete: function(client, socket, room, data) {
          if (client.focus == room) {
            document.querySelectorAll(`[data-key="${data[0]}"]`).forEach(x => {
              if (x.nextElementSibling) {
                var banner = x.nextElementSibling.getAttribute("data-banner")
                if (banner) {
                  x.nextElementSibling.remove()
                }
              }
              x.remove()
            })
            var meta = document.querySelector(`.application-chat-meta [data-group="${room}"] [data-message="${data[0]}"]`)
            if (meta) {
              meta.remove()
            }
            if (document.querySelector(".application-chat-wrapper").children.length == 2) {
              var banner = document.querySelector(".chat-banner-item:not([data-banner])")
              if (banner) {
                banner.remove()
              }
            } else if (document.querySelector(".application-chat-wrapper").children.length == 0) {
              client.renderMessage({content: "This is the beginning of this group", banner: true, unique: "begin", position: "afterbegin"})
            }
          }
        },
        deleteall: function(client, socket, room, data) {
          if (client.focus == room) {
            data.forEach(x => {
              document.querySelectorAll(`[data-key="${x}"]`).forEach(y => {
                if (y.nextElementSibling) {
                  var banner = y.nextElementSibling.getAttribute("data-banner")
                  if (banner) {
                    y.nextElementSibling.remove()
                  }
                }
                y.remove()
              })
              var meta = document.querySelector(`.application-chat-meta [data-group="${room}"] [data-message="${x}"]`)
              if (meta) {
                meta.remove()
              }
            })
            if (document.querySelector(".application-chat-wrapper").children.length == 2) {
              var banner = document.querySelector(".chat-banner-item:not([data-banner])")
              if (banner) {
                banner.remove()
              }
            } else if (document.querySelector(".application-chat-wrapper").children.length == 0) {
              client.renderMessage({content: "This is the beginning of this group", banner: true, unique: "begin", position: "afterbegin"})
            }
          }
        },
        clearall: function(client, socket, room, data) {
          if (client.focus == room) {
            if (data[0] == "ok") {
              client.setFocus({group: room, reload: true})
            }
          }
        },
        blocklist: function(client, socket, room, data) {
          if (client.focus == room) {
            var alreadyEmpty = document.querySelector('[data-index="ban"] [data-empty="bannedMember"]')
            if (alreadyEmpty) document.querySelector('[data-index="ban"]').replaceChildren(alreadyEmpty)
            document.querySelector('[data-page="ban"]').querySelector(".modal-page-navigation:first-child").classList.add("display-none")
            if (data.join(":").length) {
              var selected = document.querySelector('[data-page="ban"] [data-page-click]')
              var selectPrev = selected && selected.getAttribute("data-page-prev")
              var empty = document.createElement("div")
              empty.className = "empty-item margin-auto"
              empty.setAttribute("data-empty", "bannedMember")
              empty.textContent = "No banned members."
              var member = data.join(":").split(";")
              var banned = [empty]
              var overwrite = []
              member.forEach(x => {
                var target = x.split(":")
                //["avatar", "logs", "comment", "unban"]
                var item = client.renderMessage({username: target[2] || "!anon", group: room, timestamp: target[3], content: `Banned by ${target[4]}.`, session: target[0], ip: target[1], flag: [], action: ["avatar", "unban"], pfp: true, node: true})
                overwrite.push(`${target[0]}:${target[1]}:${target[2]}`)
                banned.push(item)
                document.querySelector(".application-chat-wrapper").querySelectorAll(`[data-user="${target[2]}"] [data-action="Ban"], [data-ip="${target[1]}"] [data-action="Ban"], [data-session="${target[0]}"] [data-action="Ban"]`).forEach(y => {
                  y.setAttribute("data-action", "Unban")
                  y.firstElementChild.className = "chat-option-icon fa-solid fa-ban"
                  y.onclick = z => {
                    client.messageAction(z.currentTarget, "unban", item, {guest: !target[2]}, z)
                  }
                })
              })
              client.groups[room].room.banned.member = overwrite
              if (selectPrev) banned.reverse()
              document.querySelector('[data-index="ban"]').replaceChildren(...banned)
              if (member.length < 50) {
                document.querySelector('[data-page="ban"]').querySelector(".modal-page-navigation:last-child").classList.add("display-none")
              } else {
                document.querySelector('[data-page="ban"]').querySelector(".modal-page-navigation:last-child").classList.remove("display-none")
              }
              var page = document.querySelector('[data-page="ban"] [data-page-number]')
              var number = +page.getAttribute("data-page-number")
              if (client.frame.blocklist.length) {
                var frame = client.frame.blocklist
                if (frame[2] == "prev") {
                  page.setAttribute("data-page-number", number - 1)
                  if (number - 1 <= 1) {
                    document.querySelector('[data-page="ban"]').querySelector(".modal-page-navigation:first-child").classList.add("display-none")
                    document.querySelector('[data-page="ban"]').querySelector(".modal-page-navigation:last-child").classList.remove("display-none")
                    page.setAttribute("data-page-number", 1)
                  } else {
                    document.querySelector('[data-page="ban"]').querySelector(".modal-page-navigation:first-child").classList.remove("display-none")
                  }
                } else {
                  page.setAttribute("data-page-number", frame[1] == 0 ? 1: number + 1)
                  if (frame[1] == 0) {
                    document.querySelector('[data-page="ban"]').querySelector(".modal-page-navigation:first-child").classList.add("display-none")
                  } else {
                    document.querySelector('[data-page="ban"]').querySelector(".modal-page-navigation:first-child").classList.remove("display-none")
                  }
                }
                client.frame.blocklist = []
              } else {
                client.setPage({page: "ban", frame: "blocklist:block:%s:%i:50:anons:%g"})
              }
            } else {
              document.querySelector('[data-page="ban"]').querySelectorAll(".modal-page-navigation").forEach(x => {
                x.classList.add("display-none")
              })
              document.querySelector('[data-index="ban"] [data-empty="bannedMember"]').textContent = "No banned members."
            }
          }
        },
        blocked: function(client, socket, room, data) {
          if (client.focus == room) {
            var item = {username: data[2] || "!anon", group: room, timestamp: Date.now() / 1000, content: `Banned by ${data[3]}.`, session: data[0], ip: data[1], flag: [], action: ["avatar", "logs", "comment", "unban"], node: true}
            var message = client.renderMessage(item)
            document.querySelector('[data-index="ban"]').prepend(message)
            document.querySelector(".application-chat-wrapper").querySelectorAll(`[data-user="${data[2]}"] [data-action="Ban"], [data-ip="${data[1]}"] [data-action="Ban"], [data-session="${data[0]}"] [data-action="Ban"]`).forEach(x => {
              x.setAttribute("data-action", "Unban")
              x.firstElementChild.className = "chat-option-icon fa-solid fa-ban"
              x.onclick = y => {
                client.messageAction(y.currentTarget, "unban", item, {guest: !data[2], original: true}, y)
              }
            })
            document.querySelector('[data-index="unban"]').querySelectorAll(`[data-user="${data[2]}"] [data-action="Ban"], [data-ip="${data[1]}"] [data-action="Ban"], [data-session="${data[0]}"] [data-action="Ban"]`).forEach(x => {
              x.remove()
            })
            client.groups[room].room.banned.member.push(`${data[0]}:${data[1]}:${data[2]}`)
          }
        },
        unblocklist: function(client, socket, room, data) {
          if (client.focus == room) {
            var alreadyEmpty = document.querySelector('[data-index="unban"] [data-empty="unbannedMember"]')
            if (alreadyEmpty) document.querySelector('[data-index="unban"]').replaceChildren(alreadyEmpty)
            document.querySelector('[data-page="unban"]').querySelector(".modal-page-navigation:first-child").classList.add("display-none")
            if (data.join(":").length) {
              var selected = document.querySelector('[data-page="unban"] [data-page-click]')
              var selectPrev = selected && selected.getAttribute("data-page-prev")
              var empty = document.createElement("div")
              empty.className = "empty-item margin-auto"
              empty.setAttribute("data-empty", "unbannedMember")
              empty.textContent = "No unbanned members."
              var member = data.join(":").split(";")
              var unbanned = [empty]
              var banned = client.groups[room].room.banned.member
              member.forEach(x => {
                var target = x.split(":")
                var filtered = banned.filter(x => x.includes(target[0]) || x.includes(target[1]) || x.includes(target[2]))
                var item = client.renderMessage({username: target[2] || "!anon", group: room, timestamp: target[3], content: `Unbanned by ${target[4]}.`, session: target[0], ip: target[1], flag: [], action: ["avatar", filtered.length ? 0: "ban"], pfp: true, node: true})
                unbanned.push(item)
              })
              if (selectPrev) unbanned.reverse()
              document.querySelector('[data-index="unban"]').replaceChildren(...unbanned)
              if (member.length < 50) {
                document.querySelector('[data-page="unban"]').querySelector(".modal-page-navigation:last-child").classList.add("display-none")
              } else {
                document.querySelector('[data-page="unban"]').querySelector(".modal-page-navigation:last-child").classList.remove("display-none")
              }
              var page = document.querySelector('[data-page="unban"]').querySelector("[data-page-number]")
              var number = +page.getAttribute("data-page-number")
              if (client.frame.blocklist.length) {
                var frame = client.frame.blocklist
                if (frame[2] == "prev") {
                  page.setAttribute("data-page-number", number - 1)
                  if (number - 1 <= 1) {
                    document.querySelector('[data-page="unban"]').querySelector(".modal-page-navigation:first-child").classList.add("display-none")
                    document.querySelector('[data-page="unban"]').querySelector(".modal-page-navigation:last-child").classList.remove("display-none")
                    page.setAttribute("data-page-number", 1)
                  } else {
                    document.querySelector('[data-page="unban"]').querySelector(".modal-page-navigation:first-child").classList.remove("display-none")
                  }
                } else {
                  page.setAttribute("data-page-number", number + 1)
                  document.querySelector('[data-page="unban"]').querySelector(".modal-page-navigation:first-child").classList.remove("display-none")
                }
                client.frame.blocklist = []
              } else {
                client.setPage({page: "unban", frame: "blocklist:unblock:%s:%i:50:anons:%g"})
              }
            } else {
              document.querySelector('[data-page="unban"]').querySelectorAll(".modal-page-navigation").forEach(x => {
                x.classList.add("display-none")
              })
            }
          }
        },
        unblocked: function(client, socket, room, data) {
          if (client.focus == room) {
            var meta = data.slice(-2)
            var member = data.join(":").split(";")
            member.forEach(x => {
              var target = x.split(":")
              var item = {username: target[2] || "!anon", group: room, timestamp: Date.now() / 1000, content: `Unbanned by ${meta[0]}.`, session: target[0], ip: target[1], flag: [], action: ["avatar", "logs", "comment", "ban"], node: true}
              var message = client.renderMessage(item)
              document.querySelector('[data-index="unban"]').prepend(message)
              document.querySelector(".application-chat-wrapper").querySelectorAll(`[data-user="${target[2]}"] [data-action="Unban"], [data-ip="${target[1]}"] [data-action="Unban"], [data-session="${target[0]}"] [data-action="Unban"]`).forEach(y => {
                y.setAttribute("data-action", "Ban")
                y.firstElementChild.className = "chat-option-icon fa-solid fa-gavel"
                y.onclick = z => {
                  client.messageAction(z.currentTarget, "ban", item, {guest: !target[2], original: true}, z)
                }
              })
              document.querySelector('[data-index="ban"]').querySelectorAll(`[data-user="${target[2]}"], [data-ip="${target[1]}"], [data-session="${target[0]}"]`).forEach(x => {
                x.remove()
              })
              var banned = client.groups[room].room.banned.member
              client.groups[room].room.banned.member = banned.filter(x => !x.includes(target[2] || false) || !x.includes(target[1]) || !x.includes(target[0]))
            })
          }
        },
        allunblocked: function(client, socket, room, data) {
          console.log(`allunblocked: ${data}`)
        },
        mods: function(client, socket, room, data) {
          console.log(data)
          if (data.length > 0) {
            var staff = {}
            data.forEach(x => {
              var names = x.split(",")
              var user = names[0]
              if (user.length) {
                var level = []
                for (let x in chatango.flags.moderator) {
                  var find = x & parseInt(names[1])
                  if (find) {
                    level.push(chatango.flags.moderator[x])
                  }
                }
                staff[user] = level
              }
            })
            client.groups[room].room.moderator = staff
          }
        },
        climited: function(client, socket, room, data) {
          if (client.focus == room) {
            console.log(data)
            if (data[1] == "bm") {
              client.systemMessage({content: "Message failed to deliver, you are being rate limited. Try again in 5 seconds."})
            } else if (data[1] == "delmsg") {
              client.systemMessage({content: "Message could not be deleted, you are being rate limited. Delete all at once or slow down."})
            }
          }
        },
        getannc: function(client, socket, room, data) {
          console.log(`getannc: ${data}`)
          if (client.focus == room) {
            var announce = 0
            var interval = 0
            var content = ""
            if (data[0] != "none") {
              announce += parseInt(data[0])
              interval += parseInt(data[3])
              content += data.slice(4).join(":")
              var flags = announce == 3 ? ["ANNC_ICON", "BG_ON", "PREMIUM"]: ["ANNC_ICON", "PREMIUM"]
              client.renderMessage({username: `#${data[1]}`, group: room, timestamp: Date.now() / 1000, content: content, announcement: true, flag: flags})
            } else {
              client.renderMessage({username: `#${room}`, group: room, timestamp: Date.now() / 1000, content: "Edit announcement", announcement: true, flag: ["ANNC_ICON", "PREMIUM"]})
            }
            var parameter = {enable: Boolean(announce), broadcast_mode: false, background: announce == 3, interval: interval / 60}
            var revoke = content.replace(/([a-f0-9]{3}|[a-f0-9]{6})=/i, "")
            var style = {
              bold: content.includes("<b>"),
              italic: content.includes("<i>"),
              underline: content.includes("<u>"),
              size: revoke.match(/<f x(\d{2})/) || [0, "11"],
              face: content.match(/="(\d{1})"/) || [0, "0"],
              name: content.match(/<n([a-f0-9]{3}|[a-f0-9]{6})\/>/i) || [0, "000"],
              color: content.match(/([a-f0-9]{3}|[a-f0-9]{6})=/i) || [0, "000"]
            }
            var decode = document.createElement("div")
            decode.innerHTML = content.replace(/<.*?>/g, "")
            parameter.content = decode.textContent
            parameter.style = style
            client.groups[room].updateAnnouncement(parameter)
          }
        },
        annc: function(client, socket, room, data) {
          var flags = data[0] == 3 ? ["ANNC_ICON", "BG_ON", "PREMIUM"]: ["ANNC_ICON", "PREMIUM"]
          var item = {username: `#${data[1]}`, group: room, timestamp: Date.now() / 1000, content: data.slice(2).join(":"), flag: flags, position: "beforeend", ephemeral: true, node: true}
          var message = client.renderMessage(item)
          if (client.focus == room) {
            document.querySelector(".application-chat-wrapper").insertAdjacentElement("beforeend", message)
          }
        },
        verificationrequired: function(client, socket, room, data) {
          client.systemMessage({content: "A verified email is required to participate in this group."})
        },
        proxybanned: function(client, socket, room, data) {
          client.systemMessage({content: "This group has banned proxies and VPNs."})
        },
        mustlogin: function(client, socket, room, data) {
          client.systemMessage({content: "You must log in with a Chatango account to participate in this group."})
        },
        chatango: function(client, socket, room, data) {
          console.log(`chatango: ${data}`)
          client.systemMessage({username: "Chatango", content: data.join(":")})
        },
        show_nlp: function(client, socket, room, data) {
          if (data[0] == 2) {
            client.systemMessage({content: "You got a warning for repetitive messages, you may be restricted."})
          } else if (data[0] == 16) {
            client.systemMessage({content: "Your message does not appear to make sense, you may be restricted."})
          }
        },
        msglexceeded: function(client, socket, room, data) {
          client.systemMessage({content: "Your message exceeded the character limit."})
        },
        limitexceeded: function(client, socket, room, data) { // max i found to be 26
          client.setPlaceholder({enable: "false", content: "Close some connections"})
          client.renderMessage({content: "You have connected to this group too many times", banner: true, unique: "begin", position: "afterbegin"})
        },
        miu: function(client, socket, room, data) {
          console.log(`miu: ${data}`)
          var target = data[0]
          chatango.getBackground({username: target, reload: true})
        },
        updateprofile: function(client, socket, room, data) {
          if (!client.cache.avatar.includes(data[0])) {
            client.cache.avatar.push(data[0])
            var avatars = chatango.getAvatar(data[0])
            var request = []
            avatars.images.slice(0, 3).forEach(x => {
              request.push(
                fetch(x, {
                  cache: "reload"
                }).then(async response => {
                  document.querySelectorAll(`[src="${x}"]`).forEach(y => {
                    y.src = data[0] in torch.groups ? chatango.renderIcon(room).src: x
                    if (data[0] == client.user.name && y.classList.contains("external-avatar-image")) {
                      y.onload = () => {
                        var view = document.querySelector(".external-modal").getAttribute("data-external") == "avatar"
                        var image = document.querySelector(".external-avatar-image")
                        if (view && image && !image.cropper) {
                          new Cropper(document.querySelector(".external-avatar-image"), {
                            aspectRatio: 1,
                            viewMode: 2,
                            preview: ".user-avatar-preview",
                            checkOrientation: true,
                            ready() {
                              console.log("owo")
                            }
                            //crop(x) {console.log(x.detail)}
                          })
                        }
                      }
                    }
                  })
                })
              )
            })
            Promise.all(request).then(() => {
              client.cache.avatar = client.cache.avatar.filter(x => x != data[0])
            })
          }
        },
        updgroupinfo: function(client, socket, room, data) {
          client.groups[room].updateInformation({title: data[0], description: data[1], decode: true})
        },
        groupflagsupdate: function(client, socket, room, data) {
          if (room in client.groups) {
            client.groups[room].room.flag = []
            for (let x in chatango.flags.group) {
              var find = x & parseInt(data[0])
              if (find) {
                client.groups[room].room.flag.push(chatango.flags.group[x])
              }
            }
            if (client.groups[room].room.flag.indexOf("NO_REPETITION") >= 0) {
              client.groups[room].room.character = 850
            } else {
              client.groups[room].room.character = 2900
            }
            if (client.focus == room) {
              if (client.groups[room].room.flag.indexOf("IS_CLOSED") >= 0) {
                client.setPlaceholder({enable: "false", content: `#${room} is closed`, clear: true})
              } else if (client.groups[room].room.flag.indexOf("BROADCAST_MODE") >= 0) {
                var moderator = client.groups[room].user.moderator && client.user.name in client.groups[room].room.moderator && client.groups[room].room.moderator[client.user.name].indexOf("CAN_BROADCAST") >= 0
                if (client.user.name == client.groups[room].room.owner || moderator) {
                  client.setPlaceholder({enable: torch.crossBrowser, content: `Broadcast to #${room}`, focus: true})
                } else {
                  client.setPlaceholder({enable: "false", content: `#${room} is in broadcast mode`, clear: true})
                }
              } else {
                client.setPlaceholder({enable: torch.crossBrowser, content: `Message in #${room}`, focus: true})
              }
              if (client.groups[room].room.flag.indexOf("NO_CHANNELS") >= 0) {
                client.groups[room].user.channel.select = 0
                document.querySelectorAll(".channel-wrapper").forEach(x => {
                  Array.from(x.children).slice(0, -1).forEach(y => {
                    y.setAttribute("data-disabled", true)
                  })
                })
                var select = document.querySelector(".channel-item-select")
                if (select) {
                  select.classList.remove("channel-item-select")
                  document.querySelector('[data-send="channels"]').removeAttribute("style")
                }
                document.querySelectorAll(".channel-item-filter").forEach(x => {
                  x.classList.remove("channel-item-filter")
                })
              } else {
                var select = document.querySelector(".channel-item-select")
                if (select) {
                  select.classList.remove("channel-item-select")
                  document.querySelector('[data-send="channels"]').removeAttribute("style")
                }
                document.querySelectorAll(".channel-item-filter").forEach(x => {
                  x.classList.remove("channel-item-filter")
                  document.querySelector('[data-send="channels"]').removeAttribute("style")
                })
                document.querySelectorAll(".channel-wrapper").forEach(x => {
                  Array.from(x.children).forEach(y => {
                    if (x.parentNode.getAttribute("data-preload") == "filter") {
                      if (client.groups[room].user.channel.filtered.indexOf(y.getAttribute("data-channel")) >= 0) {
                        y.classList.add("channel-item-filter")
                      }
                    }
                    y.removeAttribute("data-disabled")
                  })
                })
                var apply = document.querySelector('[data-preload="channels"]').querySelector(`[data-flag="${client.groups[room].user.channel.select}"]`)
                if (apply) {
                  apply.classList.add("channel-item-select")
                  document.querySelector('[data-preload="filter"]').querySelector(`[data-flag="${client.groups[room].user.channel.select}"]`).setAttribute("data-disabled", true)
                  document.querySelector('[data-send="channels"]').style.color = apply.firstElementChild.style.background ? "#777": apply.firstElementChild.style.backgroundColor
                }
              }
            }
          }
        },
        badbansearchstring: function(client, socket, room, data) {
          console.log(`badbansearchstring: ${data}`)
          var errors = {
            1: "Search query is too long!",
            2: "Not a valid username!",
            4: "Not a valid IP address!"
          }
          var code = data[0]
          var empty = document.createElement("div")
          empty.className = "empty-item margin-auto"
          empty.setAttribute("data-empty", "bannedMember")
          empty.textContent = errors[code]
          document.querySelector('[data-index="ban"]').replaceChildren(empty)
        },
        bansearchresult: function(client, socket, room, data) {
          console.log(`bansearchresult: ${data}`)
          var empty = document.createElement("div")
          empty.className = "empty-item margin-auto"
          empty.setAttribute("data-empty", "bannedMember")
          empty.textContent = "No ban found."
          var banned = [empty]
          if (data[1].length) {
            var ban_contains = ""
            if (data[0].length) ban_contains = "\r\rIncludes: " + data[0].split(";").join(", ")
            var ts = data.slice(5).join(":") + " GMT-0800"
            var item = client.renderMessage({username: data[1] || "!anon", group: room, timestamp: new Date(ts) / 1000, content: `Banned by ${data[4]}.${ban_contains}`, session: data[3], ip: data[2], flag: [], action: ["avatar", "logs", "comment", "unban"], pfp: true, node: true})
            banned.push(item)
          }
          document.querySelector('[data-index="ban"]').replaceChildren(...banned)
        },
        modactions: function(client, socket, room, data) {
          console.log(`modactions: ${data}`)
        },
        bw: function(client, socket, room, data) {
          console.log(`bw: ${data}`)
        },
        ubw: function(client, socket, room, data) {
          console.log(`ubw: ${data}`)
        },
        notifysettings: function(client, socket, room, data) {
          console.log(`notifysettings: ${data}`)
        }
      },
      private: {
        OK: function(client, socket, room, data) {
          var pm = new Private(client, socket)
          socket.send("settings\r\n")
          socket.send("wl\r\n")
          socket.send("getblock\r\n")
          socket.send("getpremium\r\n")
          client.private = pm
          if (room == client.cache.connecting) {
            client.cache.connecting = false
          }
        },
        DENIED: function(client, socket, room, data) {
          alert("RELOGIN REQUIRED, UR SESSION EXPIRED AAAAAAAA")
        },
        seller_name: function(client, socket, room, data) {
          console.log(`pm seller_name: ${data}`)
          socket.send(`msg:${torch.server}:getpmr\r\n`)
        },
        kickingoff: function(client, socket, room, data) {
          client.private.disconnectFrom()
          client.systemMessage({content: "You have logged in to private messages elsewhere and have been disconnected here."})
          client.setPlaceholder({enable: "false", content: "Private messages"})
        },
        msg: function(client, socket, room, data) {
          console.log(`PRIVATE MESSAGE RECEIVED: ${data}`)
          var flags = []
          for (let x in chatango.flags.message) {
            var find = x & parseInt(data[4])
            if (find) {
              flags.push(chatango.flags.message[x])
            }
          }
          if (client.focus == room && client.private.focus == data[0]) {
            var key = `${data[3]}=`.replace(".", "_")
            client.private.saveMessage(data, data[0], false)
            client.renderMessage({username: data[0], group: room, timestamp: data[3], content: data.slice(5).join(":"), key: key, flag: flags, position: "beforeend"})
          } else {
            var ignore = client.settings.safety.users.ignore.includes(data[0])
            if (!ignore) {
              if (client.private.focus == data[0]) {
                if (client.settings.notifications.sound.play_mention) {
                  client.sound.message.volume = parseInt(client.settings.notifications.sound.volume_mention) / 100
                  client.sound.message.play()
                }
              } else if (client.user.away.enable && client.user.away.message && !client.user.away.sent.includes(data[0])) {
                if (client.user.away.friendsOnly) {
                  if (client.private.friends.includes(data[0])) {
                    client.sendMessage(client.user.away.message, false, room, data[0])
                    client.user.away.sent.push(data[0])
                  }
                } else {
                  client.sendMessage(client.user.away.message, false, room, data[0])
                  client.user.away.sent.push(data[0])
                }
              }
              if (client.settings.notifications.display.tab_title) {
                var old = document.title
                document.title = `${data[0]} private messaged you!`
                setTimeout(() => {
                  document.title = old
                }, 5000)
              }
            }
            client.private.saveMessage(data, data[0], true)
            var item = {username: data[0], role: "unread", private: true, unique: true, first: !ignore}
            var recent = document.querySelector(`[data-people="recent"] [data-target="${data[0]}"]`)
            if (recent) {
              var status = recent.getAttribute("data-status")
              var timestamp = recent.getAttribute("data-timestamp")
              if (status && timestamp) {
                item.status = status
                item.timestamp = timestamp
              }
            }
            sidebar.renderPerson(item)
            var amount = +document.querySelector('[data-sidebar="private"]').getAttribute("data-amount")
            document.querySelector('[data-sidebar="private"]').classList.add("application-icon-mention")
            document.querySelector('[data-sidebar="private"]').setAttribute("data-amount", amount + 1)
            if (client.focus != room && client.cache.listen.includes(data[0])) {
              flags.push("CLIENT_ICON")
              var key = `${data[3]}=`.replace(".", "_")
              client.renderMessage({username: data[0], group: room, timestamp: data[3], content: data.slice(5).join(":"), key: key, flag: flags, position: "beforeend", client_only: true})
            }
          }
        },
        msgoff: function(client, socket, room, data) {
          client.private.saveMessage(data, data[0], true)
          sidebar.renderPerson({username: data[0], role: "unread", private: true, unique: true, first: true})
        },
        connect: async function(client, socket, room, data) {
          console.log(`pm connect: ${data}`)
          if (data[0]) {
            switch (data[2]) {
              case "invalid":
                var recent = document.querySelector(`[data-people="recent"] [data-target="${data[0]}"]`)
                if (recent) {
                  client.private.setFocus({username: data[0], status: data[2]})
                } else {
                  client.systemMessage({content: `${data[0]} does not exist or is a group chat.`})
                }
                break;
              case "nouser":
                client.systemMessage({content: `${data[0]} is not associated with a Chatango account.`})
                break;
              case "online":
              case "app":
              case "offline":
                var recent = document.querySelector(`[data-people="recent"] [data-target="${data[0]}"]`)
                var prevStatus = recent && recent.getAttribute("data-status") == "online" && recent.getAttribute("data-timestamp") || Date.now() / 1000
                var blocked = false

                if (client.settings.privacy.private_messages.check_block && recent && data[2] == "offline") {
                  var ts = recent.getAttribute("data-timestamp")
                  try {
                    await fetch(`//api.vissle.me/v1/profile/${data[0]}?get=status&verify=false`).then(async response => {
                      if (response.status == 200) {
                        var blocking = await response.json()
                        if (blocking.status) {
                          var newTs = parseInt(blocking.status.time)
                          if (parseInt(ts) != newTs) blocked = true
                        }
                      }
                    })
                  } catch(e) {
                    console.error(e)
                  }
                }

                var status = data[2] == "online" && data[1] != 0 ? "idle": data[2]
                var timestamp = status == "idle" ? (Date.now() - parseInt(data[1]) * 60 * 1000) / 1000: status == "online" ? prevStatus: data[1]
                client.private.setFocus({username: data[0], status: status, timestamp: timestamp, blocked: blocked})
            }
          } else {
            client.systemMessage({content: "Username does not exist or is a group chat."})
          }
        },
        track: function(client, socket, room, data) {
          console.log(`pm track: ${data}`)
        },
        time: function(client, socket, room, data) {
          chatango.server.time = (+data[0] * 1000) - Date.now()
        },
        premium: function(client, socket, room, data) {
          if (client.user.background && ["200", "210"].indexOf(data[0]) >= 0) {
            socket.send("msgbg:1\r\n")
          }
          client.private.premium = {
            status: +data[0],
            timestamp: +data[1]
          }
        },
        status: function(client, socket, room, data) {
          console.log(`pm status: ${data}`)
          if (client.private.focus == data[0]) {
            switch (data[2]) {
              case "online":
                client.systemMessage({content: `${data[0]} is now online.`, avatar: data[2], unique: "status"})
                break;
              case "offline":
                client.systemMessage({content: `${data[0]} is now offline.`, avatar: data[2], unique: "status"})
                break;
              case "app":
                client.systemMessage({content: `${data[0]} is now idle on the Chatango mobile app.`, avatar: data[2], unique: "status"})
            }
          }
          var item = document.querySelectorAll(`[data-people="friends"] [data-target="${data[0]}"], [data-people="recent"] [data-target="${data[0]}"]`)
          item.forEach(x => {
            var parent = x.parentNode.getAttribute("data-role")
            if (!["blocked", "ignored"].includes(parent)) {
              x.setAttribute("data-status", data[2])
              x.setAttribute("data-timestamp", data[1])
            }
          })
        },
        reload_profile: function(client, socket, room, data) { // profupdated
          console.log(`pm reload_profile: ${data}`)
          if (data[0] in client.cache.profile) {
            var target = data[0]
            delete client.cache.profile[target]
          }
        },
        wl: function(client, socket, room, data) {
          console.log(`pm wl: ${data}`)
          if (!data[0].length) {
            socket.send("wldelete::\r\n")
          }
          Array.from(["online", "idle", "offline"]).forEach(x => {
            document.querySelector(`[data-role="${x}"]`).replaceChildren()
          })
          pythonRange(0, data.length, 4).forEach(x => {
            var user = data.slice(x, x + 4)
            client.private.friends.push(user[0])
            if (user[2] == "on") {
              if (user[3] == 0) {
                sidebar.renderPerson({username: user[0], role: "online", status: "online", timestamp: user[1], private: true, unique: true})
              } else {
                var idle = (Date.now() - parseInt(user[3]) * 60 * 1000) / 1000
                sidebar.renderPerson({username: user[0], role: "idle", status: "idle", timestamp: idle, private: true, unique: true})
              }
            } else if (user[2] == "app") {
              sidebar.renderPerson({username: user[0], role: "idle", status: "app", timestamp: user[1], private: true, unique: true})
            } else if (user[2] == "off") {
              sidebar.renderPerson({username: user[0], role: "offline", status: "offline", timestamp: user[1], private: true, unqiue: true})
            }
          })
        },
        wlonline: function(client, socket, room, data) {
          sidebar.renderPerson({username: data[0], role: "online", status: "online", timestamp: Date.now() / 1000, private: true, unique: true})

          var ignore = client.settings.safety.users.ignore.includes(data[0])
          var interval_online = client.sound.interval.play_online.has(data[0])
          if (!interval_online && !ignore && client.private.focus != data[0] && client.settings.notifications.sound.play_online) {
            client.sound.interval.play_online.add(data[0])
            client.sound.play_online.volume = parseInt(client.settings.notifications.sound.volume_online) / 100
            client.sound.play_online.play()
            setTimeout(() => {
              client.sound.interval.play_online.delete(data[0])
            }, 5 * 60 * 1000)
          }
        },
        wloffline: function(client, socket, room, data) {
          sidebar.renderPerson({username: data[0], role: "offline", status: "offline", timestamp: Date.now() / 1000, private: true, unique: true})
          var item = document.querySelector(`[data-people="recent"] [data-target="${data[0]}"]`)
          if (item) {
            item.setAttribute("data-status", "offline")
            item.setAttribute("data-timestamp", Date.now() / 1000)
          }
        },
        wlapp: function(client, socket, room, data) {
          sidebar.renderPerson({username: data[0], role: "idle", status: "app", timestamp: Date.now() / 1000, private: true, unique: true})
        },
        wladd: function(client, socket, room, data) {
          console.log(`pm wladd: ${data}`)
          client.private.friends.push(data[0])
          switch (data[1]) {
            case "on":
              if (data[2] == 0) {
                sidebar.renderPerson({username: data[0], role: "online", status: "online", timestamp: Date.now() / 1000, private: true, unique: true})
              } else {
                var idle = (Date.now() - parseInt(data[2]) * 60 * 1000) / 1000
                sidebar.renderPerson({username: data[0], role: "idle", status: "idle", timestamp: idle, private: true, unique: true})
              }
              break;
            case "app":
              sidebar.renderPerson({username: data[0], role: "idle", status: "app", timestamp: data[2], private: true, unique: true})
              break;
            case "off":
              sidebar.renderPerson({username: data[0], role: "offline", status: "offline", timestamp: data[2], private: true, unqiue: true})
          }
        },
        wldelete: function(client, socket, room, data) {
          console.log(`pm wldelete: ${data}`)
          var item = document.querySelector(`[data-people="friends"] [data-target="${data[0]}"]`)
          if (item) {
            if (data[1] == "deleted") {
              client.private.friends = client.private.friends.filter(x => x != data[0])
              item.remove()
            }
          }
        },
        idleupdate: function(client, socket, room, data) {
          if (client.private.focus == data[0]) {
            if (data[1] == 1) {
              client.systemMessage({content: `${data[0]} is now online.`, avatar: "online", unique: "status"})
            } else {
              client.systemMessage({content: `${data[0]} is now idle.`, avatar: "idle", unique: "status"})
            }
          }
          var item = document.querySelectorAll(`[data-people="friends"] [data-target="${data[0]}"], [data-people="recent"] [data-target="${data[0]}"]`)
          item.forEach(x => {
            var parent = x.parentNode.getAttribute("data-role")
            if (!["blocked", "ignored"].includes(parent)) {
              var recent = ["unread", "read"].includes(parent)
              if (data[1] == 1) {
                sidebar.renderPerson({username: data[0], role: recent ? parent: "online", status: "online", timestamp: Date.now() / 1000, private: true, unique: true, first: recent ? true: false})
              } else {
                sidebar.renderPerson({username: data[0], role: recent ? parent: "idle", status: "idle", timestamp: Date.now() / 1000, private: true, unique: true, first: recent ? true: false})
              }
            }
          })
        },
        presence: function(client, socket, room, data) {
          console.log(`pm presence: ${data}`)
          var loaded = document.querySelector(".application-chat-meet .content-loading")
          if (loaded) {
            loaded.remove()
          }
          pythonRange(0, data.length, 3).forEach(x => {
            var user = data.slice(x, x + 3)
            if (user[1] > 0) {
              chatango.renderMini(document.querySelector(".application-chat-meet"), {username: user[0], status: "idle", sidebar: true}).then(profile => {
                var apply = document.querySelector(".application-chat-meet").querySelector(`[data-target="${user[0]}"]`)
                if (apply) {
                  apply.replaceWith(profile)
                }
              })
            } else {
              chatango.renderMini(document.querySelector(".application-chat-meet"), {username: user[0], status: user[2], sidebar: true}).then(profile => {
                var apply = document.querySelector(".application-chat-meet").querySelector(`[data-target="${user[0]}"]`)
                if (apply) {
                  apply.replaceWith(profile)
                }
              })
            }
          })
        },
        block_list: function(client, socket, room, data) {
          document.querySelector('[data-role="blocked"]').replaceChildren()
          if (data.length) {
            data.forEach(x => {
              sidebar.renderPerson({username: x, role: "blocked"})
            })
            var current_block = new Set(client.private.blocked)
            var added = data.filter(item => !current_block.has(item))
            if (added.length) {
              var item = document.querySelector(`[data-people="recent"] [data-target="${added[0]}" i]`)
              if (item) item.remove()
              if (client.focus == "private_message" && client.private.focus == added[0]) client.private.initiate()
            }
            client.private.blocked = data
          }
          if (client.private.init) {
            client.private.init = false
            client.private.viewRecent()
          }
        },
        unblocked: function(client, socket, room, data) {
          console.log(`pm unblocked: ${data}`)
          client.private.blocked = client.private.blocked.filter(x => x != data[0])
          var target = document.querySelector(`[data-role="blocked"] [data-target="${data[0]}"]`)
          if (target) {
            target.remove()
          }
        },
        settings: function(client, socket, room, data) {
          console.log(`pm settings: ${data}`)
        },
        show_fw: function(client, socket, room, data) {
          client.systemMessage({content: "You got a warning for spam, you may be disconnected from private messages."})
        },
        show_offline_limit: function(client, socket, room, data) {
          if (client.focus == room && client.private.focus == data[0]) {
            client.systemMessage({content: `Your message failed to be delivered, ${client.private.focus} has a full inbox.`})
          }
        },
        toofast: function(client, socket, room, data) {
          client.private.disconnectFrom()
          client.systemMessage({content: "You have been disconnected from private messages because of spam."})
          client.setPlaceholder({enable: "false", content: "Private messages"})
        },
        firstlogin: function(client, socket, room, data) {
          console.log(`pm firstlogin: ${data}`)
        },
        lowversion: function(client, socket, room, data) {
          console.log(`pm lowversion: ${data}`)
        }
      }
    }
    this.flags = {
      message: {
        avatar: {
          icon: "fa-image",
          extra: "Show avatar"
        },
        reply: {
          icon: "fa-reply",
          extra: "Reply to",
          modify: true
        },
        mention: {
          icon: "fa-at",
          extra: "Mention user",
          modify: true
        },
        quote: {
          icon: "fa-quote-left",
          extra: "Quote message",
          modify: true
        },
        edit: {
          icon: "fa-pen",
          extra: "Edit message",
          modify: true
        },
        logs: {
          icon: "fa-file-lines",
          extra: "View logs"
        },
        comment: {
          icon: "fa-comment",
          extra: "Comment on",
          modify: true
        },
        ban: {
          icon: "fa-gavel",
          extra: "Ban user",
          destructive: true
        },
        unban: {
          icon: "fa-ban",
          extra: "Unban user",
          destructive: true
        },
        delete: {
          icon: "fa-trash-can",
          extra: "Delete message",
          destructive: true
        },
        who: {
          icon: "fa-mask",
          extra: "Who is this",
          more: true
        },
        profile: {
          icon: "fa-user",
          extra: "View profile",
          more: true
        },
        jump: {
          icon: "fa-location-crosshairs",
          extra: "Jump to"
        },
        remove: {
          icon: "fa-trash-can",
          extra: "Remove message",
          destructive: true
        },
        help: {
          icon: "fa-question",
          extra: "What is this"
        },
        emoji: {
          icon: "fa-face-grin-wide",
          extra: "Emojis"
        },
        font: {
          icon: "fa-font",
          extra: "Fonts"
        },
        channel: {
          icon: "fa-hashtag",
          extra: "Channels"
        },
        upload: {
          icon: "fa-file-arrow-up",
          extra: "Upload file",
          more: true
        },
        command: {
          icon: "fa-terminal",
          extra: "Use command",
          more: true
        },
        friend: {
          icon: "fa-user-plus",
          extra: "Add friend",
        },
        unfriend: {
          icon: "fa-user-minus",
          extra: "Remove friend",
        },
        message: {
          icon: "fa-message",
          extra: "Send message"
        },
        block: {
          icon: "fa-user-slash",
          extra: "Block user",
          destructive: true
        },
        unblock: {
          icon: "fa-user-check",
          extra: "Unblock user"
        },
        listen: {
          icon: "fa-ear",
          extra: "Listen to user",
          more: true
        },
        unlisten: {
          icon: "fa-ear-deaf",
          extra: "Unlisten to user",
          more: true
        },
        ignore: {
          icon: "fa-eye-slash",
          extra: "Ignore user",
          more: true
        },
        unignore: {
          icon: "fa-eye",
          extra: "Unignore user",
          more: true
        },
        close: {
          icon: "fa-x",
          extra: "Close chat",
          more: true
        },
        more: {
          icon: "fa-ellipsis"
        },
        user_status: {
          icon: "fa-user-clock",
          extra: "Set status"
        },
        user_settings: {
          icon: "fa-user-gear",
          extra: "User settings"
        },
        user_switch: {
          icon: "fa-user-plus",
          extra: "Switch account"
        },
        user_logout: {
          icon: "fa-right-from-bracket",
          extra: "Log out",
          destructive: true
        },
        group_favorite: {
          icon: "fa-star",
          extra: "Favorite group"
        },
        group_unfavorite: {
          icon: "fa-regular fa-star",
          extra: "Unfavorite group"
        },
        group_settings: {
          icon: "fa-users-gear",
          extra: "Group settings"
        },
        group_leave: {
          icon: "fa-right-to-bracket",
          extra: "Leave group",
          destructive: true
        },
        commands: {
          background: {
            icon: "fa-fill-drip",
            extra: "/background [user]",
            description: "> /background [optional: user]\rToggle the background of a user.\rIf no user is supplied, it defaults to yourself."
          },
          chat: {
            icon: "fa-message",
            extra: "/chat [optional: user]",
            description: "> /chat [user]\rChat with a user in private messages.\rIf no user is supplied, you are redirected to private messages."
          },
          join: {
            icon: "fa-plus",
            extra: "/join [group]",
            description: "> /join [group]\rAttempt to join a group chat."
          },
          leave: {
            icon: "fa-right-to-bracket",
            extra: "/leave [group]",
            description: "> /leave [group]\rLeave a group chat and remove it from the sidebar."
          },
          style: {
            icon: "fa-font",
            extra: "/style [user]",
            description: "> /style [optional: user]\rToggle the font styles of a user.\rIf no user is supplied, it defaults to yourself."
          },
          help: {
            icon: "fa-question",
            extra: "/help [command]",
            description: "> /help [optional: command]\rShows what a command does.\rIf no command is supplied, it shows a list of available commands."
          }
        }
      }
    }
    this.settings = {}
    this.sound = {
      mention: new Audio(`${torch.static}/media/mention.mp3`),
      message: new Audio(`${torch.static}/media/message.mp3`),
      play_online: new Audio(`${torch.static}/media/play_online.mp3`),
      interval: {
        play_online: new Set()
      }
    }
  }

  emit(event, data) {
    var parse = new CustomEvent(`chatango_${event}`, {detail: data})
    this.events[event] = parse
    document.dispatchEvent(parse)
  }

  on(event, callback) {
    document.addEventListener(`chatango_${event}`, callback)
  }

  socket(data, frame, content, force) {
    try {
      var connection = data == "private_message" ? this.private.socket: this.groups[data].socket
      if (connection.readyState == connection.CONNECTING) {
        this.systemMessage({group: this.focus, content: `${content}\rThe connection to #${data} is being established.`})
      } else if (connection.readyState == connection.CLOSING) {
        this.systemMessage({group: this.focus, content: `${content}\rThe connection to #${data} is being terminated.`})
      } else if (connection.readyState == connection.CLOSED) {
        this.systemMessage({group: this.focus, content: `${content}\rThe connection to #${data} was terminated.`})
      } else {
        connection.send(`${frame}\r\n`)
        if (data == "private_message" && this.private.focus || force) {
          var item = frame.split(":")
          if (item[0] == "msg") {
            var time = (Date.now() + chatango.server.time) / 1000
            var flag = 0
            var flags = [this.user.background ? "BG_ON": null, [200, 210].includes(this.private.premium.status) ? "PREMIUM": null]
            for (let x of flags) {
              var find = Object.keys(chatango.flags.message).find(y => chatango.flags.message[y] == x)
              if (find) {
                flag += +find
              }
            }
            this.private.saveMessage([this.private.user, this.private.user, "unknown", time.toString(), flag.toString(), item.slice(2).join(":")], force || this.private.focus, false)
            var payload = {username: this.user.full, group: data, timestamp: time, content: item.slice(2).join(":"), session: time, key: "pm", flag: flags, position: "beforeend"}
            if (force) {
              payload.flag.push("CLIENT_ICON")
              payload.client_self = true
              var amount = document.querySelector('[data-sidebar="private"]').getAttribute("data-amount")
              if (amount) {
                document.querySelector('[data-sidebar="private"]').classList.remove("application-icon-mention")
                document.querySelector('[data-sidebar="private"]').setAttribute("data-amount", 0)
              }
              var lastMsg = document.querySelector(`[data-people="recent"] [data-target="${force}"][data-lastmsg]`)
              if (lastMsg) {
                var forceStatus = document.querySelector(`[data-people="recent"] [data-target="${force}"]`).getAttribute("data-status")
                var forceTs = document.querySelector(`[data-people="recent"] [data-target="${force}"]`).getAttribute("data-timestamp")
                sidebar.renderPerson({username: force, role: "read", status: forceStatus, timestamp: forceTs, lastmsg: lastMsg.getAttribute("data-lastmsg"), private: true, unique: true, first: true})
              }
            }
            this.renderMessage(payload)
          }
        }
      }
    } catch(error) {
      this.systemMessage({group: this.focus, content: `${content}\rThe connection to #${data} has not been established.`})
      console.error(error)
    }
  }

  requests(data) {
    let u = data.username
    let p = data.password
    let key = data.key
    let token = data.token
    let loading = false

    let session = new FormData()
    session.set("pwd", p)
    session.set("sid", u)
    fetch(chatango.path("script/setcookies", "st"), {
      method: "POST",
      body: session
    })

    let domain = verify => {
      let whitelist = {
        [torch.host]: {
          "chatango/group": {},
          "chatango/room": {},
          "chatango/updateprofile": {},
          "chatango/updateavatar": {
            filename: "image",
            uploading: "Uploading %s as group icon.",
            uploading_pm: "Uploading %s as group icon."
          },
          "chatango/upload": {
            filename: "filedata",
            uploading: "Uploading %s in #%g.",
            uploading_pm: "Uploading %s to %u."
          }
        },
        "chatango.com": {
          updatemsgbg: {
            filename: "Filedata",
            uploading: "Uploading %s as background image.",
            uploading_pmg: "Uploading %s as background image."
          },
          updatemsgstyles: {},
          updateprofile: {
            filename: "Filedata",
            uploading: "Uploading %s as avatar.",
            uploading_pm: "Uploading %s as avatar."
          },
          uploadimg: {
            filename: "filedata",
            uploading: "Uploading %s in #%g through Chatango.",
            uploading_pm: "Uploading %s to %u through Chatango."
          },
          "script/creategrouploginjs": {}
        }
      }
      let check = document.createElement("a")
      check.href = verify
      let host = check.host == torch.host ? torch.host: check.host.split(".").slice(-2).join(".")
      if (host in whitelist && check.pathname.slice(1) in whitelist[host]) {
        return whitelist[host][check.pathname.slice(1)]
      }
    }

    this.connect = group => {
      return new Promise(async (resolve, reject) => {
        this.socketEvent(group, {token: token, un: u, pw: p}, resolve, reject)
      })
    }

    this.post = (host, form, item) => {
      var secure = domain(host)
      if (secure) {
        if (item.credential) {
          form.set(item.credential, u)
          form.set("p", p)
        } else if (item.key) {
          form.set("key", key)
        } else if (item.token) {
          form.set(item.token, token)
        } else if (!item.cookie) {
          form.set("s", token)
        }
        return new Promise(async (resolve, reject) => {
          if (loading) {
            console.log("a request is in progress")
            return reject(loading)
          }
          try {
            loading = host
            if (item.progress) {
              var request = new XMLHttpRequest()
              if (!form.get(secure.filename).name) {
                var noimage = await fetch(`${torch.static}/img/noimage.jpg`)
                var blob = await noimage.blob()
                var file = new File([blob], "noimage.jpg", {type: blob.type})
                form.set(secure.filename, file)
              }
              client.setNotice({enable: true, icon: "spinner", content: client.focus == "private_message" ? secure.uploading_pm.replaceAll("%u", client.private.focus): secure.uploading.replaceAll("%s", form.get(secure.filename).name).replaceAll("%g", client.focus), animation: "rotation 1.5s linear infinite", button: "Cancel", action: () => {request.abort(); document.querySelector(".external-modal-avatar .external-modal-header").removeAttribute("style")}})
              request.open("POST", host)
              request.upload.onprogress = x => {
                var percent = (x.loaded / x.total) * 100
                var gradient = `linear-gradient(to right, var(--theme-active) ${percent}%, var(--theme-secondary) 0%)`
                document.querySelector(".application-notice").style.background = gradient
                document.querySelector(".external-modal-avatar .external-modal-header").style.background = gradient
              }
              request.onload = x => {
                var response = x.target.responseText.split(":")
                switch (response[0]) {
                  case "OK":
                    client.socket(client.focus, "miu", "Could not show updated background")
                  case "success":
                    document.querySelector(".chat-upload").value = ""
                    client.setNotice({icon: "check", color: "var(--theme-active)", content: "File successfully uploaded.", button: "Thanks"})
                    client.sendMessage(chatango.subdomain.t_(client.user.name, response[1]))
                    break;
                  case "data":
                    client.setNotice({icon: "check", color: "var(--theme-active)", content: "File successfully uploaded.", button: "Delete"})
                    client.sendMessage(`${torch.domain}/${response[1]}`)
                    break;
                  case "pix":
                    client.setNotice({icon: "check", color: "var(--theme-active)", content: "Avatar successfully set.", button: "Remove",
                      action: async () => {
                        var noimage = await fetch(`${torch.static}/img/noimage.jpg`)
                        var blob = await noimage.blob()
                        var file = new File([blob], "noimage.jpg", {type: blob.type})
                        form.set(secure.filename, file)
                        client.post(host, form, item)
                      }
                    })
                    document.querySelector(".external-modal-avatar .external-modal-header").removeAttribute("style")
                    document.querySelector('[data-upload="avatar"]').value = ""
                    break;
                  case "unauthed":
                    client.setNotice({icon: "warning", color: "var(--theme-highlight)", content: "Relogin required.", button: "Reload", action: () => location.reload()})
                    break;
                  case "error":
                    client.setNotice({icon: "warning", color: "var(--theme-highlight)", content: response[1], button: "Retry", action: () => client.post(host, form, item)})
                }
                loading = false
                resolve(x.target.responseText)
              }
              request.onerror = x => {
                client.setNotice({icon: "warning", color: "var(--theme-highlight)", content: "File upload failed.", button: "Retry", action: () => client.post(host, form, item)})
                loading = false
                document.querySelector('[data-upload="avatar"]').value = ""
                reject(x)
              }
              request.onabort = x => {
                client.setNotice({icon: "warning", content: "File upload canceled.", button: "Retry", action: () => client.post(host, form, item)})
                loading = false
                document.querySelector('[data-upload="avatar"]').value = ""
                reject("File upload canceled.")
              }
              request.onreadystatechange = x => {
                if (x.target.status != 200) {
                  loading = false
                  document.querySelector('[data-upload="avatar"]').value = ""
                  reject(x.target.status in item.status ? item.status[x.target.status](): x.target.status)
                }
              }
              request.send(form)
            } else {
              var depend = host.endsWith("chatango/updateprofile")
              var payload = {method: "POST", body: depend ? JSON.stringify(Object.fromEntries(form)): form}
              if (item.cookie) {
                payload.credentials = "include"
              }
              fetch(host, payload).then(async response => {
                if (response.headers.get("content-type") == "application/json") {
                  var content = await response.json()
                  loading = false
                  resolve(content)
                } else {
                  var content = await response.text()
                  var frame = content.split(":")[0]
                  if (frame in secure) {
                    secure[frame](...frame)
                  }
                  loading = false
                  resolve(content)
                }
              }).catch(error => {
                console.log(error)
                loading = false
                reject(error)
              })
            }
          } catch(error) {
            console.error(error)
            loading = false
            reject(error)
          }
        })
      } else {
        
      }
    }
  }

  async setProfile(data, context) {
    var target = this.user.name
    if (data.error) {
      this.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: data.error})
      return
    }

    this.user.avatar = {}
    Array.from(["x0", "y0", "ts"]).forEach(x => {
      this.user.avatar[x] = data[x]
    })
    document.querySelector('[data-setting="show_profile"] input').checked = data.dir == "checked"
    document.querySelector('[data-text-field="age"]').value = data.age
    document.querySelector('[data-text-field="gender"]').value = data.sex
    if (data.sex == "?") {
      document.querySelector('[data-text-field="gender"] option').removeAttribute("hidden")
      document.querySelector('[data-text-field="gender"] option').removeAttribute("disabled")
    }
    document.querySelector('[data-text-field="location"]').value = data.loc != "None" ? data.loc: ""
    var about = decodeURIComponent(data.eline)
    document.querySelector('[data-text-field="about"]').value = about.length == 1 ? about.trim(): about
    var tracker = about.match(/<script src="(?:https:)?\/\/vissle.me\/profile\/(\d+)"><\/script>/)
    document.querySelector('[data-content="profile"] .filter-apply').textContent = `${tracker ? "Edit": "Add"} profile tracker`

    await chatango.renderMini(document.querySelector('[data-profile="preview"]'), {username: target, clean: true, avatar: true, force: true, reload: true}).then(profile => {
      profile.firstElementChild.style.width = "initial"

      document.querySelector('[data-option-button="full"] [data-button="save"]').onclick = () => {
        document.querySelector('[data-hide="full"]').click()
      }

      document.querySelector('[data-content="full"]').onsubmit = x => {
        x.preventDefault()
        var form = new FormData(x.target)
        Array.from(["body_bg_col", "body_col", "body_a_col"]).forEach(y => {
          var value = form.get(y)
          form.set(y, value.startsWith("#") ? value.slice(1): value)
        })
        form.set("body_tile_d", +document.querySelector('[data-content="full"] [name="bg_tile_d"]').checked)
        form.set("body_tile_a", +document.querySelector('[data-content="full"] [name="bg_tile_a"]').checked)
        if (document.querySelector('[data-setting="show_profile"] input').checked) form.set("dir", "checked")
        this.post(`${chatango.path("updateprofile")}?css`, form, {}).then(async response => {
          var combine = response.split("&").map(x => x.split("="))
          var sign = new Map(combine)
          await this.setProfile(Object.fromEntries(sign), "Your profile styles have been saved.")
        }).catch(error => {
          this.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: error.message})
        })
      }

      if (target in this.cache.profile) {
        var custom = this.user.profile.custom || this.cache.profile[target].custom
        if (custom["background-color"]) {
          document.querySelector('[data-color="mini-bg-color"]').value = custom["background-color"]
          document.querySelector('[data-color-input="mini-bg-color"]').value = custom["background-color"]
          document.querySelector('[data-color-input="mini-bg-color"]').style.color = custom["background-color"]
        }
        if (custom["color"]) {
          document.querySelector('[data-color="mini-text-color"]').value = custom["color"]
          document.querySelector('[data-color-input="mini-text-color"]').value = custom["color"]
          document.querySelector('[data-color-input="mini-text-color"]').style.color = custom["color"]
        }
        if (custom["link-color"]) {
          document.querySelector('[data-color="mini-link-color"]').value = custom["link-color"]
          document.querySelector('[data-color-input="mini-link-color"]').value = custom["link-color"]
          document.querySelector('[data-color-input="mini-link-color"]').style.color = custom["link-color"]
        }
        if (custom["background-image-source"]) {
          document.querySelector('[data-text-field="mini-bg-img"]').value = custom["background-image-source"]
        }
        if (custom["background-repeat"] == "repeat") {
          switch (custom["background-repeat"]) {
            case "repeat":
              document.querySelector('[data-content="full"] [name="bg_tile_d"]').checked = true
              document.querySelector('[data-content="full"] [name="bg_tile_a"]').checked = true
              break;
            case "repeat-y":
              document.querySelector('[data-content="full"] [name="bg_tile_d"]').checked = true
              break;
            case "repeat-x":
              document.querySelector('[data-content="full"] [name="bg_tile_a"]').checked = true
              break;
          }
        }
      }
    })

    await fetch(chatango.subdomain.mod2(target)).then(async response => {
      if (response.headers.get("content-type") == "text/xml") {
        var content = await response.text()
        var mod2 = new DOMParser()
        var information = mod2.parseFromString(content, "text/xml")
        var body = information.querySelector("body").textContent
        var parse = decodeURIComponent(body)
        document.querySelector('[data-text-field="full"]').value = parse.length == 1 ? parse.trim(): parse
      }
    })

    if (context) {
      this.setNotice({enable: true, icon: "check", color: "var(--theme-active)", content: context})
    }
  }

  setMessage(node) {
    node.onkeyup = x => {
      if (x.key != "ArrowUp" && x.key != "ArrowDown" && !x.currentTarget.innerHTML.match(/:([^ ]+)$/)) {
        if (x.currentTarget.innerHTML.startsWith("/")) {
          var meta = document.querySelector(`.application-chat-meta[data-group="${this.focus}"]`)
          var command = x.currentTarget.innerHTML.slice(1)
          var match = Object.keys(this.flags.message.commands).filter(x => x.includes(command))
          if (!meta || meta.classList.contains("display-none") && match.length) {
            var data = {action: ["commands"].concat(match), persist: true, height: true, expand: "calc(100vw - 348px)", top: -14, left: 10, select: true}//120px
            //data.bottom = 52
            this.setContext(document.querySelector(".chat-send-message"), data)
          } else {
            this.setContext(document.querySelector(".chat-send-message"), {action: []})
          }
        } else {
          this.setContext(document.querySelector(".chat-send-message"), {action: []})
        }
      }
      var maximum = this.focus == "private_message" ? this.private.character: this.groups[this.focus].room.character
      if (x.currentTarget.offsetHeight >= 80) {
        document.querySelector(".chat-message-limit").setAttribute("data-amount", maximum - this.sendMessage(x.currentTarget.innerHTML, true).length)
      } else {
        document.querySelector(".chat-message-limit").removeAttribute("data-amount")
      }
    }
    node.onkeydown = x => {
      var autocomplete = node.innerHTML.match(/:([^ ]+)$/)
      if (!["Enter", "ArrowUp", "ArrowDown"].includes(x.key)) {
        if (autocomplete) {
          this.setContext(document.querySelector(".chat-send-message"), {action: [], persist: true, height: true, expand: "calc(100vw - 348px)", select: true})
          this.searchMedia(autocomplete[1], true).then(y => {
            Object.keys(y).forEach(z => {
              var item = document.createElement("div")
              item.className = "application-context-item"
              item.onclick = a => {
                var select = document.querySelector(".application-chat .application-context-select")
                if (select) {
                  node.innerHTML = node.innerHTML.replace(/:([^ ]+)$/, "")
                  this.setPlaceholder({append: `${z}&nbsp;`, focus: true})
                  this.setContext(document.querySelector(".chat-send-message"), {action: []})
                }
              }
              item.onmouseover = a => {
                var select = document.querySelector(".application-context-select")
                if (select) {
                  select.classList.remove("application-context-select")
                }
                a.currentTarget.classList.add("application-context-select")
              }
              item.onmouseout = a => {
                a.currentTarget.classList.remove("application-context-select")
              }
              var media = document.createElement("div")
              media.className = "media-item-complete"
              var source = document.createElement("img")
              source.src = chatango.crawl(z, true)
              var label = document.createElement("span")
              label.textContent = y[z]
              media.append(source, label)
              var action = document.createElement("span")
              action.className = "application-context-action"
              action.textContent = `media ${z}`
              item.append(media, action)
              document.querySelector(".application-chat .application-chat-context").appendChild(item)
            })
            var height = document.querySelector(".application-chat-context.application-context-visible")
            if (height && height.lastElementChild) {
              height.lastElementChild.classList.add("application-context-select")
              height.style.top = `calc(100% - ${height.clientHeight + 50}px)`
              height.style.left = 70
            }
          })
        } else {
          this.setContext(document.querySelector(".chat-send-message"), {action: []})
        }
      }
      if (x.key == "Enter" && !x.shiftKey) {
        var command = document.querySelector(".application-chat .application-chat-context").querySelector(".application-context-select")
        if (command) {
          var context = command.querySelector(".application-context-action").textContent.split(" ")
          if (context[0] == "media") {
            x.currentTarget.innerHTML = x.currentTarget.innerHTML.replace(autocomplete[0], "")
            this.setPlaceholder({append: `${context[1]}&nbsp;`, focus: true})
            this.setContext(document.querySelector(".chat-send-message"), {action: []})
          } else {
            this.setMeta({username: this.user.name, content: context[0]}, false, "terminal", "Command")
            this.setPlaceholder({insert: `${context[0]}&nbsp;`, focus: true})
          }
        } else {
          this.sendMessage(x.currentTarget.innerHTML)
          x.currentTarget.innerHTML = ""
        }
        x.preventDefault()
      } else if (x.key == "ArrowUp") {
        var command = document.querySelector(".application-chat .application-chat-context")
        var select = command.querySelector(".application-context-select")
        if (select) {
          var previous = select.previousElementSibling
          select.classList.remove("application-context-select")
          if (previous) {
            previous.classList.add("application-context-select")
          } else {
            select.parentNode.lastElementChild.classList.add("application-context-select")
          }
          x.preventDefault()
        } else if (command.lastElementChild) {
          command.lastElementChild.classList.add("application-context-select")
          x.preventDefault()
        }
      } else if (x.key == "ArrowDown") {
        var command = document.querySelector(".application-chat .application-chat-context")
        var select = command.querySelector(".application-context-select")
        if (select) {
          var next = select.nextElementSibling
          select.classList.remove("application-context-select")
          if (next) {
            next.classList.add("application-context-select")
          } else {
            select.parentNode.firstElementChild.classList.add("application-context-select")
          }
          x.preventDefault()
        } else if (command.firstElementChild) {
          command.firstElementChild.classList.add("application-context-select")
          x.preventDefault()
        }
      } else if (x.currentTarget.innerHTML.match(/@([a-z0-9]{1,20})(&nbsp;| )?/i) && x.key == "Tab") {
        var query = x.currentTarget.innerHTML.match(/@([a-z0-9]{1,20})(&nbsp;| )?/i)[1].toLowerCase()
        var tabbed = x.currentTarget.getAttribute("data-tab")
        if (tabbed) {
          query = tabbed
          x.currentTarget.setAttribute("data-tab", tabbed)
        } else {
          x.currentTarget.setAttribute("data-index", -1)
          x.currentTarget.setAttribute("data-tab", query)
        }
        var member = document.querySelector('.sidebar-people[data-people="members"]').querySelectorAll(".sidebar-user-item")
        var index = Array.from(member).map(x => x.getAttribute("data-target")).sort()
        var current = x.currentTarget.getAttribute("data-index")
        x.currentTarget.setAttribute("data-index", parseInt(current) + 1)
        var first = index.filter(x => x.toLowerCase().indexOf(query) >= 0)[parseInt(current) + 1]
        if (first) {
          x.currentTarget.innerHTML = x.currentTarget.innerHTML.replace(/@([a-z0-9]{1,20})(&nbsp;| )?/i, `@${first}&nbsp;`)
        } else {
          x.currentTarget.setAttribute("data-index", 0)
          var second = index.filter(x => x.toLowerCase().indexOf(query) >= 0)[0]
          if (second) {
            x.currentTarget.innerHTML = x.currentTarget.innerHTML.replace(/@([a-z0-9]{1,20})(&nbsp;| )?/i, `@${second}&nbsp;`)
          }
        }
        var range = document.createRange()
        range.selectNodeContents(x.currentTarget)
        range.collapse(false)
        var selection = getSelection()
        selection.removeAllRanges()
        selection.addRange(range)
        x.preventDefault()
      } else {
        x.currentTarget.removeAttribute("data-tab")
      }
    }
    node.onpaste = x => {
      var item = x.clipboardData
      console.log(item)
      console.log(item.files[0])
    }
  }

  sendMessage(data, length, group, username, force) {
    var focus = group ? group: this.focus
    var messenger = username ? username: this.private.focus
    var generate = Math.random()
    var identifier = Math.round(15E5 * generate).toString(36)
    var fonts = document.querySelector('[data-preload="fonts"]')
    var data = data.replaceAll("&nbsp;", " ").replace(/ +/g, " ").replaceAll(/(<br>|\n)/g, "<br/>")
    if (this.user.style) {
      var style = {
        bold: fonts.querySelector(".fa-bold").previousElementSibling.checked,
        italic: fonts.querySelector(".fa-italic").previousElementSibling.checked,
        underline: fonts.querySelector(".fa-underline").previousElementSibling.checked,
        strikethrough: fonts.querySelector(".fa-strikethrough").previousElementSibling.checked,
        fontFace: document.querySelector(".font-face").firstElementChild.value,
        fontSize: document.querySelector(".font-size .text-input").value.padStart(2, "0"),
        nameColor: document.querySelector('[data-color="nameColor"]').value.slice(1),
        fontColor: document.querySelector('[data-color="fontColor"]').value.slice(1)
      }
    } else {
      var style = {
        fontFace: "0",
        fontSize: "11",
        nameColor: "000",
        fontColor: "000"
      }
    }
    var meta = document.querySelector(`.application-chat-meta[data-group="${focus}"]`)
    var metatag = meta ? meta.classList.contains("display-none"): true
    var forcePrivate = false
    if (!metatag && meta.getAttribute("data-private") && focus != "private_message") {
      focus = "private_message"
      var member = meta.querySelector(".chat-meta-member")
      var username = member.querySelector(".chat-meta-text").textContent
      messenger = username.toLowerCase()
      forcePrivate = username.toLowerCase()
    }

    var flag = focus == "private_message" ? 0: this.groups[focus].user.channel.select + this.groups[focus].user.badge
    var sensitive = this.user.name != this.user.full && this.user.full.match(/^([a-z0-9]{1,20})$/i) ? `<u${this.user.full}/>`: ""
    var privacy = `<n${style.nameColor}/><i${Math.round(15E11 * generate).toString(36)}/>`
    privacy += sensitive
    privacy += `<m v="1"><g x${style.fontSize}s${style.fontColor}="${style.fontFace}">`
    var message = focus == "private_message" ? privacy: `<n${style.nameColor}/><f x${style.fontSize}${style.fontColor}="${style.fontFace}">`
    var content = ""
    if (style.bold) {content += "<b>"}
    if (style.italic) {content += "<i>"}
    if (style.underline) {content += "<u>"}
    if (style.strikethrough && focus == "private_message") {content += "\u2593"}
    content += client.settings.appearance.messages.parse_markdown ? mdParseStyle(data): data
    if (style.strikethrough && focus == "private_message") {content += "\u2592"}
    if (style.underline) {content += "</u>"}
    if (style.italic) {content += "</i>"}
    if (style.bold) {content += "</b>"}
    if (focus == "private_message") {
      content += "</g></m>"
    }
    var extract = content.replace(/<.*?>/g, "").trim()
    if (extract.length > 0) {
      var capture = message
      var emojiEscape = document.querySelector('[data-preload="emoji"] [name="escapeEmoji"]')
      if (emojiEscape.checked) {
        var entity = Object.keys(chatango.emojis).map(x => {return x.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})
        var string = new RegExp(`((?<![^>\\s])(${entity.join("|")})(\\+\d+)?(\\?[^<\\s]*)?([^\\s<]*))`, "g")
        content = content.replaceAll(string, x => {
          return `&#${x.charCodeAt(0)};${x.slice(1)}`
        })
      }
      if (focus == "private_message" && messenger) {
        var frame = `msg:${messenger}`
        content = content.replace(/<([biup]|\/[biup])>/gi, x => x.toUpperCase())
        var youtube = content.match(/((?<![="])(?:https?:\/\/(?:(?:\w+\.)?youtube\.\w{1,3}|youtu\.be)(?:.*v=|\/\w+\/|\/)([\w-]{11})[^<\s]*))/)
        if (youtube) {
          content = content.replace(youtube[1], `<i s="vid://yt:${youtube[2]}" w="126" h="93"/>`)
        }
        content = content.replaceAll(/(?![^<]*>)(https?:\/\/[^<="\s]+\.(?:png|apng|jpg|gif|jpeg|bmp|webp)(?:\?[^<"\s]+)?)/gi, x => {
          return `<i s="${x.replaceAll("&amp;", "&")}"/>`
        })
        content = this.parseEmoji(content)
      } else {
        var frame = `bm:${identifier}:${flag}`
      }
      /*
      var flags = []
      for (let x in chatango.flags.message) {
        var find = x & flag
        if (find) {
          flags.push(chatango.flags.message[x])
        }
      }
      var badge = ""
      if (flags.includes("STAFF_ICON") && flags.includes("ADMIN_ICON")) {
      }
      */
      if (!metatag) {
        var tag = meta.querySelector(".chat-meta-text").textContent.toLowerCase()
        var target = meta.getAttribute("data-message").slice(0, -1).replaceAll("-", "hypheN").replaceAll("_", "underS")
        var member = meta.querySelector(".chat-meta-member")
        var username = member.querySelector(".chat-meta-text").textContent
        if (tag == "edit" && (extract != meta.querySelector(".chat-meta-message").textContent || length)) {
          capture += `<e${target}/>${content}`
          if (length) {
            return capture
          }
          this.socket(focus, `${frame}:${capture}`, "Your message could not be edited.", forcePrivate)
        } else if (tag == "command") {
          var argument = extract.split(" ")
          this.messageCommand(argument[0].slice(1), argument.slice(1))
        } else if (tag == "quote") {
          var index = content.lastIndexOf(data)
          var quote = content.substr(0, index) + `@${username}: \`${meta.querySelector(".chat-meta-message").innerHTML.replace(/\`/g, "").trim()}\` ` + content.substr(index)
          capture += quote
          if (length) {
            return capture
          }
          this.socket(focus, `${frame}:${capture}`, "Your quote could not be sent.", forcePrivate)
        } else if (tag == "reply") {
          capture += `<r${target}/>${content}`
          if (length) {
            return capture
          }
          this.socket(focus, `${frame}:${capture}`, "Your reply could not be sent.", forcePrivate)
        }
        document.querySelector(`.application-chat-content [data-group="${group ? group: this.focus}"]`).remove()
      } else {
        capture += content
        if (length) {
          return capture
        }
        this.socket(focus, `${frame}:${capture}`, "Your message failed to be delivered.", forcePrivate)
      }
    } else if (force && length) {
      return message
    }
  }

  setPlaceholder(data) {
    var parent = document.querySelector(".chat-send-message")
    var content = parent.getAttribute("data-placeholder")
    parent.setAttribute("contenteditable", data.enable || parent.contentEditable)
    if (data.insert != undefined && parent.contentEditable == torch.crossBrowser) {
      parent.innerHTML = data.insert
    } else if (data.append && parent.contentEditable == torch.crossBrowser) {
      parent.innerHTML += data.append
    }
    parent.setAttribute("data-placeholder", data.content || content)
    if (data.clear) {
      parent.innerHTML = ""
    }
    if (data.focus) {
      var range = document.createRange()
      range.selectNodeContents(parent)
      range.collapse(false)
      var selection = getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  setMeta(data, node, icon, action) {
    var parent = document.querySelector(".chat-send-message")
    if (parent.contentEditable == torch.crossBrowser) {
      var key = node ? node.getAttribute("data-key"): true
      var high = node
      if (!key) {
        high = node.parentNode.parentNode.parentNode.parentNode
        key = high.getAttribute("data-key")
      }
      var target = data.username.toLowerCase()
      var meta = document.querySelector(`.application-chat-content [data-group="${this.focus}"]`)
      if (!meta) {
        var chatMeta = document.createElement("div")
        chatMeta.className = "application-chat-meta"
        var metaIcon = document.createElement("span")
        metaIcon.className = "chat-meta-icon"
        chatMeta.appendChild(metaIcon)
        var text = document.createElement("span")
        text.className = "chat-meta-text"
        chatMeta.appendChild(text)
        var member = document.createElement("span")
        member.className = "chat-meta-member"
        var avatar = document.createElement("img")
        avatar.className = "chat-meta-avatar"
        member.appendChild(avatar)
        var metaText = document.createElement("span")
        metaText.className = "chat-meta-text"
        member.appendChild(metaText)
        var message = document.createElement("span")
        message.className = "chat-meta-message"
        member.appendChild(message)
        chatMeta.appendChild(member)
        var cancel = document.createElement("span")
        cancel.className = "chat-meta-cancel fa-solid fa-x"
        cancel.onclick = () => {
          chatMeta.remove()
        }
        chatMeta.appendChild(cancel)
        document.querySelector(".application-chat-send:not(.chat-message)").insertAdjacentElement("beforebegin", chatMeta)
        meta = chatMeta
      }
      if (data.group == "private_message") {
        meta.setAttribute("data-private", true)
      } else {
        meta.removeAttribute("data-private")
      }
      meta.setAttribute("data-message", key)
      meta.setAttribute("data-group", this.focus)
      if (this.private.focus) {
        meta.setAttribute("data-context", this.private.focus)
      }
      meta.querySelector(".chat-meta-avatar").src = chatango.subdomain.thumb_m(target)
      meta.querySelector(".chat-meta-avatar").alt = `${target} profile picture`
      meta.querySelector(".chat-meta-member").querySelector(".chat-meta-text").textContent = data.username
      meta.querySelector(".chat-meta-message").innerHTML = high ? high.querySelector(".chat-message-content").textContent: data.content
      if (!meta.querySelector(".chat-meta-message").textContent.trim()) {
        meta.querySelector(".chat-meta-message").innerHTML = '<span class="fa-solid fa-image"></span>'
      }
      meta.querySelector(".chat-meta-icon").className = `chat-meta-icon fa-solid fa-${icon}`
      if (data.flip) {
        meta.querySelector(".chat-meta-icon").style.transform = "rotateY(180deg)"
      }
      meta.querySelector(".chat-meta-text").textContent = action
      //meta.querySelector(".application-chat-meta").classList.remove("display-none")
    } else {
      this.systemMessage({content: `${parent.getAttribute("data-placeholder")}.`})
    }
  }

  setConnect(data) {
    if (data.enable) {
      document.querySelector(".application-connect").classList.remove("display-none")
      document.querySelector(".application-content").classList.add("display-none")
      document.querySelector(".application-sidebar").setAttribute("data-disable", true)
    } else {
      document.querySelector(".application-connect").classList.add("display-none")
      document.querySelector(".application-content").classList.remove("display-none")
      document.querySelector(".application-sidebar").removeAttribute("data-disable")
    }
    if (data.icon) {
      document.querySelector(".application-connect-icon").className = `application-connect-icon fa-solid fa-${data.icon}`
    }
    if (data.color) {
      document.querySelector(".application-connect-icon").style.color = data.color
    } else {
      document.querySelector(".application-connect-icon").style.removeProperty("color")
    }
    if (data.animation) {
      document.querySelector(".application-connect-icon").style.animation = data.animation
    } else {
      document.querySelector(".application-connect-icon").style.removeProperty("animation")
    }
    if (data.content) {
      document.querySelector(".application-connect-text").innerHTML = data.content
    }
    if (data.confirm) {
      document.querySelector(".application-connect-proceed").classList.remove("display-none")
      document.querySelector(".application-connect-confirm").innerHTML = data.confirm
    } else {
      document.querySelector(".application-connect-proceed").classList.add("display-none")
    }
    if (data.action) {
      var entry = Object.entries(data.action)
      entry.forEach((x, y) => {
        document.querySelector(`.application-connect-button:nth-child(${y + 1})`).textContent = x[0][0].toUpperCase() + x[0].slice(1)
        document.querySelector(`.application-connect-button:nth-child(${y + 1})`).onclick = x[1]
      })
    }
  }

  displayReply(data, node) {
    var replied = data.content.match(/<r(.*?)\/>/)
    if (replied) {
      var reply = replied[1].replaceAll("hypheN", "-").replaceAll("underS", "_") + "="
      var respond = document.querySelector(".application-chat-wrapper").querySelector(`[data-key="${reply}"]`)
      if (respond) {
        var separate = document.createElement("span")
        separate.className = "chat-message-separator"
        var container = document.createElement("div")
        container.className = "chat-reply-message"
        container.setAttribute("data-key", reply)
        container.onclick = () => {
          var highlight = respond.classList.contains("chat-reply-highlight")
          if (highlight) {
            respond.classList.remove("chat-reply-highlight")
          }
          respond.scrollIntoView({behavior: "smooth", block: "nearest"})
          setTimeout(() => {
            respond.classList.add("chat-reply-highlight")
          }, 500)
        }
        var avatar = document.createElement("img")
        avatar.className = "chat-reply-avatar"
        avatar.src = respond.querySelector(".chat-message-avatar").src
        container.appendChild(avatar)
        var replyContext = separate.cloneNode(true)
        replyContext.innerHTML = "> {Reply:&nbsp;"
        container.appendChild(replyContext)
        var recipient = document.createElement("span")
        recipient.className = "chat-reply-username"
        recipient.textContent = respond.querySelector(".chat-message-username").textContent
        recipient.style.color = node.querySelector(".chat-message-username").style.color
        container.appendChild(recipient)
        var replyAfter = separate.cloneNode(true)
        replyAfter.innerHTML = "}&nbsp;"
        container.appendChild(replyAfter)
        var item = respond.querySelector(".chat-message-content").textContent
        var content = document.createElement("span")
        content.className = "chat-reply-content"
        if (item) {
          content.textContent = item
        } else {
          var attachment = document.createElement("span")
          attachment.className = "fa-solid fa-image"
          content.appendChild(attachment)
        }
        content.style.color = node.querySelector(".chat-message-content").style.color
        container.appendChild(content)
        node.insertBefore(container, node.firstChild.nextElementSibling)
      }
    }
  }

  editMessage(node, data) {
    var key = node.getAttribute("data-key")
    var high = node
    if (!key) {
      high = node.parentNode.parentNode.parentNode.parentNode
      key = high.getAttribute("data-key")
    }
    var edits = high.getAttribute("data-edits") || 0
    if (edits >= 10) {
      this.systemMessage({content: "Maximum edits allowed for this message has been exceeded."})
    } else {
      this.setMeta(data, node, "pen", "Edit")
      this.setPlaceholder({insert: data.content.replace(/<.*?>/g, ""), focus: true})
    }
  }

  attachBadge(node, data) {
    var badges = node.querySelector(".chat-message-badge")
    if (!badges) {
      var badge = document.createElement("span")
      badge.className = "chat-message-badge chat-header-item"
      node.querySelector(".chat-message-username").insertAdjacentElement("afterend", badge)
      badges = badge
    }
    var status = document.createElement("span")
    status.className = `chat-badge-item ${chatango.badges[data].icon}`
    status.setAttribute("data-badge", chatango.badges[data].label)
    var label = document.createElement("span")
    label.className = "chat-badge-label"
    label.textContent = status.getAttribute("data-badge")
    status.appendChild(label)
    badges.appendChild(status)
    var separate = document.createElement("span")
    separate.className = "chat-message-separator"
    separate.innerHTML = `&nbsp;(${chatango.badges[data].label})`
    badges.appendChild(separate)
  }

  displayEdit(data, node, overwrite) {
    var edited = data.content.match(/<e(.*?)\/>/)
    if (edited) {
      var edit = edited[1].replaceAll("hypheN", "-").replaceAll("underS", "_") + "="
      var change = document.querySelector(".application-chat-wrapper").querySelector(`[data-key="${edit}"]`)
      if (change) {
        var target = node.getAttribute("data-user")
        var verify = change.getAttribute("data-user")
        if (target == verify) {
          node.style.display = "none"
          var previous = node.getAttribute("data-edit")
          var editing = change.querySelector('[data-badge="Edited"]')
          if (previous) {
            node.setAttribute("data-edit", `${node.getAttribute("data-edit")} ${edit}`)
          } else {
            node.setAttribute("data-edit", edit)
          }
          var version = change.getAttribute("data-edits") || 1
          change.setAttribute("data-edits", parseInt(version) + 1)
          if (overwrite || data.command == "u") {
            change.querySelector(".chat-message-content").innerHTML = node.querySelector(".chat-message-content").innerHTML
            if (this.user.name == target) {
              change.querySelector('[data-action="Edit"]').onclick = x => {
                this.messageAction(change, "edit", data, {}, x)
              }
            }
          } else if (!overwrite && !editing) {
            change.querySelector(".chat-message-content").innerHTML = node.querySelector(".chat-message-content").innerHTML
            if (this.user.name == target) {
              change.querySelector('[data-action="Edit"]').onclick = x => {
                this.messageAction(change, "edit", data, {}, x)
              }
            }
          }
          document.querySelector(".application-chat-wrapper").querySelectorAll(`.chat-reply-message[data-key="${change.getAttribute("data-key")}"]`).forEach(x => {
            x.querySelector(".chat-reply-content").textContent = node.querySelector(".chat-message-content").textContent
          })
          if (!editing) {
            this.attachBadge(change, "EDIT_ICON")
          }
        }
      }
    }
  }

  setPage(data) {
    var page = document.querySelector(`[data-page="${data.page}"]`)
    page.querySelector("[data-page-prev]").onclick = x => {
      var selected = document.querySelector("[data-page-click]")
      var number = page.querySelector("[data-page-number]")
      var pageNum = number.getAttribute("data-page-number")
      if (selected) selected.removeAttribute("data-page-click")
      x.currentTarget.setAttribute("data-page-click", 1)
      if (pageNum > 1) {
        var index = document.querySelector(`[data-index="${data.page}"]`).querySelectorAll("[data-timestamp]")
        if (index.length) {
          var timestamp = +index[0].getAttribute("data-timestamp")
          var offset = data.offset || 0
          var banFilter = document.querySelector('[data-filter-id="guests"]') && document.querySelector('[data-filter-id="guests"]').checked && 1 || 0
          var frame = data.frame.replace("%i", "prev").replace("%s", timestamp + offset).replace("%g", banFilter)
          var command = frame.split(":")
          var first = command[0]
          client.frame[first] = command.slice(1)
          client.groups[client.focus].socket.send(`${frame}\r\n`)
        }
      }
    }
    page.querySelector("[data-page-number]").setAttribute("data-page-number", 1)
    page.querySelector("[data-page-next]").onclick = x => {
      var selected = document.querySelector("[data-page-click]")
      var number = page.querySelector("[data-page-number]")
      if (selected) selected.removeAttribute("data-page-click")
      x.currentTarget.setAttribute("data-page-click", 1)
      var index = document.querySelector(`[data-index="${data.page}"]`).querySelectorAll("[data-timestamp]")
      if (index.length) {
        var timestamp = +Array.from(index).slice(-1)[0].getAttribute("data-timestamp")
        var offset = data.offset || 0
        var banFilter = document.querySelector('[data-filter-id="guests"]') && document.querySelector('[data-filter-id="guests"]').checked && 1 || 0
        var frame = data.frame.replace("%i", "next").replace("%s", timestamp - offset).replace("%g", banFilter)
        var command = frame.split(":")
        var first = command[0]
        client.frame[first] = command.slice(1)
        client.groups[client.focus].socket.send(`${frame}\r\n`)
      }
    }
  }

  setEnvironment(command, data) {
    switch (command) {
      case "version":
        if (this.version.number != data) {
          console.log("client version out of date")
        }
        break;
      case "bots":
        this.cache.bots.verified = data.split(";")
        break;
      case "whitelist":
        this.cache.whitelist = data.split(";")
        break;
      case "contributors":
        this.cache.contributors = data.split(";")
        break;
    }
  }

  socketEvent(group, data, resolve, reject) {
    var identifier = Math.floor(Math.random() * 1E16).toString()
    if (identifier.length <= 14) {
      for (var x = 0; x < (16 - identifier.length); x++) {
        identifier += Math.floor(Math.random() * 1E2)
      }
    }
    var group = group.toLowerCase().trim()
    if (this.cache.connect.indexOf(group) < 0) {
      this.cache.connect.push(group)
      this.cache.connecting = group
      if (Object.keys(this.groups).includes(group) && this.groups[group].socket.readyState == 1) {
        this.setFocus({group: group})
        resolve(this.groups[group].socket)
      } else {
        var authenticate = group == "private_message" ? `tlogin:${data.token}:${client.dev || 2}:${identifier}\x00`: client.dev ? `tauth:${group}:${identifier}:${data.token}\x00`: `bauth:${group}:${identifier}:${data.un}:${data.pw}\x00`
        var server = group == "private_message" ? "wss://c1.chatango.com:8081/": chatango.getServer(group)
        var exchange = {
          private_message: {
            event: client.event.private,
            command: "OK"
          },
          group: {
            event: client.event.group,
            command: "inited"
          }
        }
        var interchange = exchange[group] ?? exchange.group
        var socket = new WebSocket(server)
        socket.onopen = () => {
          socket.send(authenticate)
          document.querySelectorAll(`.sidebar-group-item [data-group="${group}"]`).forEach(x => {
            x.classList.remove("sidebar-group-pending")
          })
          var select = document.querySelector(".sidebar-group-select")
          if (!select && group == "community") {
            document.querySelector(`.sidebar-group-item [data-group="${group}"]`).classList.add("sidebar-group-select")
          }
        }
        socket.onmessage = x => {
          var frame = x.data.replace("\r\n\x00", "").split(":")
          var command = frame[0]
          var args = frame.slice(1)
          if (command in interchange.event) {
            interchange.event[command](client, socket, group, args)
            if (command == interchange.command) {
              resolve(socket)
            }
          } else {
            console.log(`[UNKNOWN] (${command}): ${args}`)
          }
        }
        socket.onerror = x => {
          console.log(x)
          document.querySelectorAll(`.application-sidebar-content [data-group="${group}"]`).forEach(y => {
            y.classList.add("sidebar-group-error")
          })
          reject("An error occurred.")
          if (group == torch.environment) {
            console.log("environment server error")
            if (torch.environment in client.groups) {
              client.setNotice({enable: true, icon: "warning", color: "var(--brand-chatango)", content: "Chatango may be restarting shortly."})
            }
          }
        }
        socket.onclose = () => {
          console.log(`conn closed: ${group}`)
          if (this.focus == group) {
            this.setNotice({
              enable: true,
              icon: "warning",
              color: "var(--theme-highlight)",
              content: `You have disconnected from #${group}`,
              button: "Reconnect",
              action: x => {
                client.setConnect({enable: true, icon: "spinner", animation: "rotation 1.5s linear infinite", content: "Reconnecting..."})
                client.connect(group).then(socket => {
                  client.cache.connect = client.cache.connect.filter(x => x != group)
                  client.setConnect({icon: "spinner", content: "Connecting..."})
                  document.querySelector(".application-notice-dismiss").click()
                  if (group == "private_message") {
                    document.querySelector('[data-sidebar="private"]').click()
                  }
                }).catch(error => {
                  client.cache.connect = client.cache.connect.filter(x => x != group)
                  client.setConnect({icon: "spinner", content: "Connecting..."})
                  client.systemMessage({content: error})
                })
              }
            })
            client.disconnectFrom(group)
            reject(`${group} is not a group or is an invalid invite.`)
          } else {
            client.disconnectFrom(group)
          }
        }
        setTimeout(() => {
          if (this.cache.connecting == group) {
            console.log(`CONNECTION TIMED OUT: ${group}`)
            reject(`Your connection timed out while connecting to ${group}.`)
          }
        }, 10000)
      }
    }
  }

  disconnectFrom(group, side, reload) {
    if (reload && this.focus != "community") {
      this.setFocus({group: "community", reload: true, force: true})
    }
    if (group in this.groups) {
      if (this.groups[group].socket.readyState == this.groups[group].socket.OPEN) {
        this.groups[group].socket.close()
      }
      clearInterval(this.groups[group].ping)
    } else if (group == "private_message") {
      this.private.disconnectFrom()
    }
    var view = document.querySelector(`.application-sidebar-content [data-group="${group}"]`)
    if (side && view) {
      view.parentNode.remove()
    } else if (view) {
      view.classList.add("sidebar-group-error")
    }
  }

  registerGroup(group) {
    if (!torch.groups[group].uid) {
      this.setNotice({enable: true, icon: "spinner", content: `Registering #${group}...`, animation: "rotation 1.5s linear infinite"})
      var form = new FormData()
      form.set("action", "register")
      form.set("group", group)
      form.set("user_id", client.user.name)
      this.post(`${torch.domain}/chatango/room`, form, {
        key: true
      }).then(async response => {
        console.log(response)
        if (response.error) {
          this.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: response.error})
        } else {
          this.setNotice({enable: true, icon: "check", color: "var(--theme-active)", content: `#${group} is now registered.`, button: "Settings", action: () => document.querySelector('[data-toolbar="settings"]').click()})
          this.displayGroup(group, response)
        }
      }).catch(error => {
        console.log(error)
        this.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: "Could not contact server, please try again later.", button: "Retry", action: () => this.renderGroup(group)})
      })
    } else {
      this.setNotice({enable: true, icon: "warning", color: "var(--theme-passive)", content: `#${group} is already registered.`})
    }
  }

  displayGroup(group, data) {
    if (!torch.groups[group].uid && data.uid) {
      torch.groups[group] = data
    }
    var icon = document.querySelector('[data-option="overview"] [data-content="icon"]')
    if (torch.groups[group].uid) {
      icon.querySelector(".window-inside-subheader").classList.add("display-none")
      if (document.querySelector(".group-icon-full").cropper) {
        document.querySelector(".group-icon-full").cropper.destroy()
      }
      document.querySelector(".group-icon-full").src = chatango.subdomain.full(data.uid)
      document.querySelector(".group-icon-full").parentNode.classList.remove("display-none")
      document.querySelector(".group-icon-preview").classList.remove("display-none")
      document.querySelector(".group-icon-thumb").src = chatango.subdomain.thumb(data.uid)
      document.querySelector(".group-icon-thumb").parentNode.classList.remove("display-none")

      var crop = document.querySelector('[data-option-button="icon"]')
      crop.querySelector('[data-button="save"]').onclick = () => {
        var box = document.querySelector(".group-icon-full").cropper.getData()
        var payload = {user_id: group, action: "thumb", x0: Math.round(box.x), y0: Math.round(box.y), ts: Math.round(box.width)}
        var form = new FormData()
        for (let x in payload) {
          form.set(x, payload[x])
        }
        this.post(`${torch.domain}/chatango/updateprofile`, form, {
          key: true
        }).then(async response => {
          if (response.success) {
            document.querySelector(".group-icon-thumb").src = document.querySelector(".group-icon-thumb").src + "?" + Date.now()
            torch.groups[group] = response.data
          } else {
            this.setNotice({icon: "warning", color: "var(--theme-highlight)", content: response.error})
          }
        })
      }
      document.querySelector('[data-form="groupicon"]').onsubmit = x => {
        x.preventDefault()
        var form = new FormData(x.target)
        if (document.querySelector(".group-icon-full").cropper) {
          document.querySelector(".group-icon-full").cropper.destroy()
        }
        form.set("user_id", group)
        this.post(`${torch.domain}/chatango/updateavatar`, form, {
          key: true,
          status: {
            403: () => {
              client.setNotice({icon: "warning", color: "var(--theme-passive)", content: "Malformatted request."})
            },
            406: () => {
              client.setNotice({icon: "warning", color: "var(--theme-passive)", content: "Unsupported file format.", button: "Retry", action: () => document.querySelector('[data-upload="groupicon"]').click()})
            }
          }
        }).then(async response => {
          console.log(response)
          if (response.error) {
            this.setNotice({icon: "warning", color: "var(--theme-highlight)", content: response.error})
          } else if (response.success) {
            client.setNotice({icon: "check", color: "var(--theme-active)", content: "Group icon successfully set.", button: "Remove", action: () => crop.querySelector('[data-button="remove"]').click()})
            delete torch.groups[group].ts
            delete torch.groups[group].x0
            delete torch.groups[group].y0
            document.querySelector('[data-close="groupSettings"]').click()
          }
        }).catch(error => {
          console.log(error)
          client.setNotice({icon: "warning", color: "var(--theme-highlight)", content: "Could not contact server, please try again later.", button: "Retry", action: () => document.querySelector('[data-upload="groupicon"]').click()})
        })
      }
      crop.querySelector('[data-button="change"]').onclick = () => {
        document.querySelector('[data-upload="groupicon"]').click()
      }
      crop.querySelector('[data-button="remove"]').onclick = async () => {
        if (document.querySelector(".group-icon-full").cropper) {
          document.querySelector(".group-icon-full").cropper.destroy()
        }
        var form = new FormData()
        var noimage = await fetch(chatango.subdomain.noimage)
        var blob = await noimage.blob()
        var file = new File([blob], "noimage.jpg", {type: blob.type})
        form.set("user_id", group)
        form.set("image", file)
        this.post(`${torch.domain}/chatango/updateavatar`, form, {
          key: true
        }).then(async response => {
          console.log(response)
          if (response.error) {
            client.setNotice({icon: "warning", color: "var(--theme-highlight)", content: response.error})
          } else if (response.success) {
            client.setNotice({icon: "check", color: "var(--theme-active)", content: "Group icon was removed."})
            torch.groups[group].ts = 50
            torch.groups[group].x0 = 0
            torch.groups[group].y0 = 0
            document.querySelector('[data-close="groupSettings"]').click()
          }
        }).catch(error => {
          console.log(error)
          client.setNotice({icon: "warning", color: "var(--theme-highlight)", content: "Could not contact server, please try again later.", button: "Retry", action: () => crop.querySelector('[data-button="remove"]').click()})
        })
      }
    } else {
      icon.querySelector(".window-inside-subheader").classList.remove("display-none")
      if (document.querySelector(".group-icon-full").cropper) {
        document.querySelector(".group-icon-full").cropper.destroy()
      }
      document.querySelector(".group-icon-full").parentNode.classList.add("display-none")
      document.querySelector(".group-icon-preview").classList.add("display-none")
      document.querySelector(".group-icon-thumb").parentNode.classList.add("display-none")
    }
  }

  setInput(data) {
    this.focus == "private_message" ? this.private.input = data: this.groups[this.focus].user.input = data
    var flag = this.focus == "private_message" ? 0: this.groups[this.focus].user.channel.select + this.groups[this.focus].user.badge
    var premium = this.groups.community.user.premium.status
    var flags = [this.user.background ? "BG_ON": null, [200, 210].includes(premium) ? "PREMIUM": null].filter(x => x)
    for (let x in chatango.flags.message) {
      var find = x & parseInt(flag)
      if (find) {
        flags.push(chatango.flags.message[x])
      }
    }
    var style = {}
    if (this.user.style) {
      var fonts = document.querySelector('[data-preload="fonts"]')
      style.bold = fonts.querySelector(".fa-bold").previousElementSibling.checked
      style.italic = fonts.querySelector(".fa-italic").previousElementSibling.checked
      style.underline = fonts.querySelector(".fa-underline").previousElementSibling.checked
    }
    var previousMessage = this.sendMessage(document.querySelector(".chat-send-message").innerHTML, true, false, false, true) || ""
    var color = previousMessage.match(/(<n.*?><(?:g|f) .*?>)/, "")
    var strip = previousMessage.replace(/(<n.*?><(?:g|f) .*?>)/, "")
    var inputBox = this.renderMessage({username: this.user.full, group: this.focus, timestamp: Date.now() / 1000, content: color ? color[1]: "", flag: flags, action: ["channel", "font", "emoji", "upload", "command"], edit: true, node: true})
    inputBox.querySelector(".chat-message-content").innerHTML = strip
    inputBox.classList.add("application-chat-send")
    inputBox.querySelector("[data-action] .fa-ellipsis").className = "chat-option-icon fa-solid fa-plus"
    inputBox.querySelector(".chat-message-content").classList.add("chat-send-message")
    if (!data.enable) {
      inputBox.querySelector(".chat-message-content").removeAttribute("contenteditable")
    }
    inputBox.querySelector(".chat-message-content").setAttribute("data-placeholder", data.content)
    if (style.bold) {
      inputBox.querySelector(".chat-message-content").style.fontWeight = "bold"
    }
    if (style.italic) {
      inputBox.querySelector(".chat-message-content").style.fontStyle = "italic"
    }
    if (style.underline) {
      inputBox.querySelector(".chat-message-content").style.textDecoration = "underline"
    }
    this.setMessage(inputBox.querySelector(".chat-message-content"))
    document.querySelector(".application-chat-send").classList.add("display-none")
    var exist = document.querySelector(".application-chat-send[data-user]")
    !exist ? document.querySelector(".application-chat-send").insertAdjacentElement("beforebegin", inputBox): document.querySelector(".application-chat-send[data-user]").replaceWith(inputBox)
    if (data.focus) {
      var parent = inputBox.querySelector(".chat-message-content")
      var range = document.createRange()
      range.selectNodeContents(parent)
      range.collapse(false)
      var selection = getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  setFocus(data) {
    if (data.init && data.group in this.groups) {
      var rank = {
        OWNER: this.user.name == this.groups[data.group].room.owner,
        MODERATOR: this.groups[data.group].user.moderator
      }
      Object.values(chatango.flags.group).forEach(x => {
        if (this.groups[data.group].room.flag.indexOf(x) >= 0) {
          document.querySelectorAll(`[data-group-permission*="${x}"]`).forEach(y => {
            var permission = y.getAttribute("data-permission")
            if (permission) {
              Object.keys(rank).forEach(z => {
                if (permission == z || z == "MODERATOR" && rank.OWNER) {
                  if (rank[z] || z == "MODERATOR" && rank.OWNER) {
                    y.removeAttribute("data-disabled")
                  } else {
                    y.setAttribute("data-disabled", true)
                  }
                }
              })
            } else {
              y.removeAttribute("data-disabled")
            }
          })
        } else {
          document.querySelectorAll(`[data-group-permission*="${x}"]`).forEach(y => {
            var permission = y.getAttribute("data-permission")
            if (permission) {
              Object.keys(rank).forEach(z => {
                if (permission == z) {
                  if (rank[z]) {
                    y.setAttribute("data-disabled", true)
                  } else {
                    y.removeAttribute("data-disabled", true)
                  }
                }
              })
            } else {
              y.setAttribute("data-disabled", true)
            }
          })
        }
      })
      if (rank.OWNER) {
        Object.values(chatango.flags.moderator).forEach(x => {
          document.querySelectorAll(`[data-user-permission*="${x}"]`).forEach(y => {
            y.removeAttribute("disabled")
          })
        })
      } else if (rank.MODERATOR) {
        Object.values(chatango.flags.moderator).forEach(x => {
          if (this.groups[data.group].room.moderator[this.user.name].indexOf(x) < 0) {
            document.querySelectorAll(`[data-user-permission*="${x}"]:not([data-user-permission*="MODERATOR"])`).forEach(y => {
              y.setAttribute("disabled", true)
            })
          } else {
            document.querySelectorAll(`[data-user-permission*="${x}"]`).forEach(y => {
              y.removeAttribute("disabled")
            })
          }
        })
      } else {
        Object.values(chatango.flags.moderator).forEach(x => {
          document.querySelectorAll(`[data-user-permission*="${x}"]`).forEach(y => {
            y.setAttribute("disabled", true)
          })
        })
      }
    } else if ((!document.querySelector(".application-sidebar").getAttribute("data-disable") || data.force) && data.group in this.groups) {
      if (this.groups[data.group].socket.readyState != this.groups[data.group].socket.OPEN) {
        document.querySelector('[data-form="join"]').querySelector('[name="group"]').value = data.group
        document.querySelector('[data-form="join"]').querySelector('[type="submit"]').click()
        return
      }
      if (this.cache.previous != data.group) {
        this.previous = "setFocus"
        this.cache.previous = data.group
        history.pushState({name: "setFocus", group: data.group}, "", location.href)
      }
      this.focus in this.groups ? this.groups[this.focus].ready = false: false
      var iframe = document.querySelector(".application-content iframe")
      if (iframe) {
        iframe.classList.add("display-none")
      }
      document.querySelector(".application-chat").classList.remove("display-none")
      var meta = document.querySelector(`.application-chat-content [data-group="${this.focus}"]`)
      if (meta) {
        meta.classList.add("display-none")
      }
      if (this.focus != "private_message") {
        this.groups[this.focus].user.message = document.querySelector(".chat-send-message").innerHTML
      }
      var changeMeta = document.querySelector(`.application-chat-content [data-group="${data.group}"]`)
      if (changeMeta) {
        changeMeta.classList.remove("display-none")
      }
      this.focus = data.group
      if (this.private) {
        document.querySelector(".application-private").classList.add("display-none")
        sidebar.changeTab("members")
        this.private.hideMeet()
        document.querySelector('[data-toolbar="settings"] span').className = "toolbar-icon fa-solid fa-users-gear"
      }
      var side = document.querySelector(".application-sidebar-content").querySelector(`[data-group="${data.group}"]`)
      if (side) {
        side.parentNode.setAttribute("data-amount", 0)
        side.parentNode.classList.remove("sidebar-group-notify", "sidebar-group-mention")
        var select = document.querySelector(".sidebar-group-select")
        if (select) {
          document.querySelector(".sidebar-group-select").classList.remove("sidebar-group-select")
        }
        side.classList.add("sidebar-group-select")
      }
      document.querySelector('.sidebar-people[data-people="members"]').setAttribute("data-group", data.group)
      document.querySelectorAll(".sidebar-sort-item").forEach(x => x.value = 0)
      document.querySelectorAll(".sidebar-sort-order").forEach(x => {
        x.setAttribute("title", "Ascending")
      })
      this.setFocus({group: data.group, init: true})
      var preload = document.querySelector('[data-window="information"]')
      Array.from(["owner", "administrator", "moderator", "user", "bot", "guest"]).forEach(x => {
        document.querySelector(`[data-role="${x}"]`).replaceChildren()
      })
      changeMenu("groupSettings", "overview")
      document.querySelector(".application-chat-wrapper").replaceChildren()
      var placeholder = {}
      if (this.groups[data.group].room.flag.indexOf("IS_CLOSED") >= 0) {
        this.setPlaceholder({enable: "false", content: `#${data.group} is closed`, clear: true})
        placeholder = {content: `#${data.group} is closed`, clear: true}
      } else if (this.groups[data.group].room.flag.indexOf("BROADCAST_MODE") >= 0) {
        var moderator = this.groups[data.group].user.moderator && this.user.name in this.groups[data.group].room.moderator && this.groups[data.group].room.moderator[this.user.name].indexOf("CAN_BROADCAST") >= 0
        if (this.user.name == this.groups[data.group].room.owner || moderator) {
          placeholder = {enable: true, content: `Type here to broadcast to #${data.group}`, insert: this.groups[data.group].user.message, focus: true}
          this.setPlaceholder({enable: torch.crossBrowser, content: `Broadcast to #${data.group}`, insert: this.groups[data.group].user.message, focus: true})
        } else {
          placeholder = {content: `#${data.group} is in broadcast mode`, clear: true}
          this.setPlaceholder({enable: "false", content: `#${data.group} is in broadcast mode`, clear: true})
        }
      } else {
        placeholder = {enable: true, content: `Type here to message in #${data.group}`, insert: this.groups[data.group].user.message, focus: true}
        this.setPlaceholder({enable: torch.crossBrowser, content: `Message in #${data.group}`, insert: this.groups[data.group].user.message, focus: true})
      }
      if (this.groups[data.group].room.flag.indexOf("NO_CHANNELS") >= 0) {
        this.groups[data.group].user.channel.select = 0
        document.querySelectorAll(".channel-wrapper").forEach(x => {
          Array.from(x.children).slice(0, -1).forEach(y => {
            y.setAttribute("data-disabled", true)
          })
        })
        var select = document.querySelector(".channel-item-select")
        if (select) {
          select.classList.remove("channel-item-select")
          document.querySelector('[data-send="channels"]').removeAttribute("style")
        }
        document.querySelectorAll(".channel-item-filter").forEach(x => {
          x.classList.remove("channel-item-filter")
        })
      } else {
        var select = document.querySelector(".channel-item-select")
        if (select) {
          select.classList.remove("channel-item-select")
          document.querySelector('[data-send="channels"]').removeAttribute("style")
        }
        document.querySelectorAll(".channel-item-filter").forEach(x => {
          x.classList.remove("channel-item-filter")
        })
        document.querySelectorAll(".channel-wrapper").forEach(x => {
          Array.from(x.children).slice(0, -1).forEach(y => {
            if (x.parentNode.getAttribute("data-preload") == "filter") {
              if (client.groups[data.group].user.channel.filtered.indexOf(y.getAttribute("data-channel")) >= 0) {
                y.classList.add("channel-item-filter")
              }
            }
            y.removeAttribute("data-disabled")
          })
        })
        var apply = document.querySelector('[data-preload="channels"]').querySelector(`[data-flag="${this.groups[data.group].user.channel.select}"]`)
        if (apply) {
          apply.classList.add("channel-item-select")
          document.querySelector('[data-preload="filter"]').querySelector(`[data-flag="${this.groups[data.group].user.channel.select}"]`).setAttribute("data-disabled", true)
          document.querySelector('[data-send="channels"]').style.color = apply.firstElementChild.style.background ? "#777": apply.firstElementChild.style.backgroundColor
        }
      }
      var title = this.groups[data.group].room.information.title
      var description = this.groups[data.group].room.information.description
      this.groups[data.group].updateInformation({title: this.groups[data.group].room.information.original.title, description: this.groups[data.group].room.information.original.description})
      if (preload) {
        var information = document.querySelector('[data-window="information"]').querySelector("[data-button]")
        if (information.getAttribute("data-button") == "Rules") {
          document.querySelector('[data-window="information"]').querySelector(".chat-window-title").textContent = title
          information.setAttribute("data-title", `#${data.group} rules`)
        } else {
          document.querySelector('[data-window="information"]').querySelector(".chat-window-title").textContent = `#${data.group} rules`
          information.setAttribute("data-title", title)
        }
        document.querySelector('[data-window="information"]').querySelector('[data-page="Information"]').textContent = description
      }
      sidebar.renderPerson({username: this.groups[data.group].room.owner, role: "owner", status: "offline"})
      var rank = {
        OWNER: this.user.name == this.groups[data.group].room.owner,
        MODERATOR: this.groups[data.group].user.moderator
      }
      this.displayGroup(data.group, torch.groups[data.group])
      if (rank.OWNER && this.settings.safety.groups.warn_unregister && !torch.groups[data.group].uid) {
        client.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: `#${data.group} is not a registered group.`, button: "Register",
          action: () => {
            client.setNotice({enable: true, icon: "spinner", content: `Registering #${data.group}...`, animation: "rotation 1.5s linear infinite"})
            var form = new FormData()
            form.set("action", "register")
            form.set("group", data.group)
            form.set("user_id", this.user.name)
            this.post(`${torch.domain}/chatango/room`, form, {
              key: true
            }).then(async response => {
              console.log(response)
              if (response.error) {
                this.setNotice({icon: "warning", color: "var(--theme-highlight)", content: response.error})
              } else {
                this.setNotice({icon: "check", color: "var(--theme-active)", content: `#${data.group} is now registered.`, button: "Settings", action: () => document.querySelector('[data-toolbar="settings"]').click()})
                this.displayGroup(data.group, response)
              }
            }).catch(error => {
              console.log(error)
              this.setNotice({icon: "warning", color: "var(--theme-highlight)", content: `An error occurred while registering #${data.group}.`})
            })
          }
        })
      }
      if (this.groups[data.group].user.badge) {
        var badge = document.querySelector('[data-preload="badges"]').querySelector('[data-index="group"]').querySelector(".badge-item-select")
        if (badge) {
          badge.classList.remove("badge-item-select")
        }
        document.querySelector('[data-preload="badges"]').querySelector(`[data-flag="${this.groups[data.group].user.badge}"]`).parentNode.classList.add("badge-item-select")
      } else {
        var badge = document.querySelector('[data-preload="badges"]').querySelector('[data-index="group"]').querySelector(".badge-item-select")
        if (badge) {
          badge.classList.remove("badge-item-select")
        }
      }

      if (this.settings.appearance.messages.preview_message) {
        this.setInput(placeholder)
      } else {
        var messageInput = document.querySelector(".application-chat-send.display-none")
        if (messageInput) {
          document.querySelector(".application-chat-send").insertAdjacentElement("beforebegin", messageInput)
          document.querySelector(".chat-message.application-chat-send").remove()
          document.querySelector(".application-chat-send.display-none").classList.remove("display-none")
        }
      }

      this.groups[data.group].load = 0
      if (data.reload) {
        this.groups[data.group].socket.send("reload_init_batch\r\n")
        this.groups[data.group].socket.send("getannouncement\r\n")
        if (rank.OWNER || rank.MODERATOR) {
          var pageClick = document.querySelectorAll('[data-page="ban"] [data-page-click], [data-page="unban"] [data-page-click]')
          pageClick.forEach(x => x.removeAttribute("data-page-click"))
          this.groups[data.group].socket.send("blocklist:block:0:next:50:anons:1\r\n")
          this.groups[data.group].socket.send("blocklist:unblock:0:next:50:anons:1\r\n")
        }
      }
      this.groups[data.group].socket.send(this.cache.overload.indexOf(data.group) >= 0 ? "gparticipants\r\n": "g_participants:start\r\n")
      document.querySelector(".application-chat-box").onscroll = () => {
        var height = (document.querySelector(".application-chat-box").scrollHeight - document.querySelector(".application-chat-box").clientHeight)
        var top = height - -document.querySelector(".application-chat-box").scrollTop
        if (this.groups[data.group].ready && this.groups[data.group].ready != "wait" && this.groups[data.group].load != -1 && [0, 1].indexOf(top) >= 0) {
          //this.renderMessage({content: "Previous messages above", banner: true, unique: "previous", position: "afterbegin"})
          this.groups[data.group].socket.send(`get_more:20:${this.groups[data.group].load}\r\n`)
          this.groups[data.group].load = 0
          this.groups[data.group].ready = "wait"
          setTimeout(x => {
            //document.querySelector(".application-chat-wrapper").querySelector(".chat-banner-item").scrollIntoView({behavior: "smooth", block: "nearest"})
          }, 1000)
        }
      }
    }
  }

  setNotice(data) {
    if (data.enable) {
      document.querySelector(".application-notice").style.display = "flex"
      document.querySelector(".application-notice").style.transform = "scale(1)"
    }
    if (data.background) {
      document.querySelector(".application-notice").style.background = data.background
    } else {
      document.querySelector(".application-notice").style.removeProperty("background")
    }
    if (data.animation) {
      document.querySelector(".application-notice-icon").style.animation = data.animation
    } else {
      document.querySelector(".application-notice-icon").style.removeProperty("animation")
    }
    if (data.action) {
      document.querySelector(".application-notice-action").onclick = data.action
    } else {
      document.querySelector(".application-notice-action").onclick = null
    }
    if (data.color) {
      document.querySelector(".application-notice-icon").style.color = data.color
    } else {
      document.querySelector(".application-notice-icon").style.removeProperty("color")
    }
    if (data.button) {
      document.querySelector(".application-notice-action").textContent = data.button
      document.querySelector(".application-notice-action").classList.remove("display-none")
    } else {
      document.querySelector(".application-notice-action").classList.add("display-none")
    }
    if (data.icon && data.content) {
      document.querySelector(".application-notice-icon").className = `application-notice-icon fa-solid fa-${data.icon}`
      document.querySelector(".application-notice-content").textContent = data.content
    }
    document.querySelector(".application-notice-dismiss").onclick = () => {
      document.querySelector(".application-notice").removeAttribute("style")
    }
  }

  setContext(node, data) {
    var level = data.level ? '.application-chat-context[data-level="top"]': '.application-chat-context[data-level="bottom"]'
    var context = document.querySelector(level)
    if (data.toggle && document.querySelector(".application-chat-context") != document.activeElement) {
      context.focus()
    }
    if (data.persist) {
      context.classList.add("application-context-visible")
    } else {
      context.classList.remove("application-context-visible")
    }
    var copy = []
    var parent = document.querySelector(".application-chat").getBoundingClientRect()
    var position = node.getBoundingClientRect()
    var notation = data.action.includes("commands") ? this.flags.message.commands: this.flags.message
    data.action.forEach(x => {
      if (x != "commands" && notation[x].extra) {
        var item = document.createElement("div")
        if (notation[x].modify && document.querySelector(".chat-send-message").contentEditable == "false") {
          item.className = "application-context-item display-none"
        } else {
          item.className = data.select && x == data.action.slice(-1)[0] ? "application-context-item application-context-select": "application-context-item"
        }
        if (notation[x].destructive) {
          item.setAttribute("data-destructive", true)
        }
        item.onclick = () => {
          var context = document.querySelector(level)
          if (data.select) {
            var command = context.querySelector(".application-context-select")
            if (command) {
              var action = command.querySelector(".application-context-action").textContent.split(" ")
              this.setMeta({username: this.user.name, content: action[0]}, false, "terminal", "Command")
              this.setPlaceholder({insert: `${action[0]}&nbsp;`, focus: true})
              context.classList.remove("application-context-visible")
            }
          } else {
            this.messageAction(node, x, data.content, data.meta, data.event)
            data.action = []
            this.setContext(node, data)
          }
        }
        item.onmouseover = y => {
          var select = document.querySelector(".application-context-select")
          if (select) {
            select.classList.remove("application-context-select")
          }
          y.currentTarget.classList.add("application-context-select")
        }
        item.onmouseout = y => {
          y.currentTarget.classList.remove("application-context-select")
        }
        var context = document.createElement("span")
        context.className = "application-context-action"
        context.textContent = notation[x].extra
        item.appendChild(context)
        var icon = document.createElement("span")
        icon.className = `application-context-icon fa-solid ${notation[x].icon}`
        item.appendChild(icon)
        copy.push(item)
      }
    })
    context.replaceChildren(...copy)
    var top = position.top
    context.style.top = data.overtop || top
    if (data.expand) {
      context.style.width = data.expand
    } else {
      context.style.removeProperty("width")
    }
    var adjust = context.getBoundingClientRect()
    if (parent.bottom - adjust.bottom < 0) {
      context.style.top = (top - (data.height ? adjust.height: 0)) + (data.top || 0)
    }
    context.style.left = (position.left - (data.width ? adjust.width: 0)) - (data.left || 0)
    if (data.bottom) {
      context.style.bottom = data.bottom
      context.style.removeProperty("top")
      context.style.removeProperty("left")
    }
  }

  attachDrag(data) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0
    var parent = data.parentNode
    data.onmousedown = dragMouseDown
    data.ontouchstart = fullScreen

    function fullScreen() {
      parent.style.width = "100%"
      parent.style.height = "100%"
    }

    function dragMouseDown(x) {
      x.preventDefault()
      pos3 = x.clientX
      pos4 = x.clientY
      document.onmouseup = stopDragging
      document.onmousemove = draggingElement
    }

    function draggingElement(x) {
      x.preventDefault()
      pos1 = pos3 - x.clientX
      pos2 = pos4 - x.clientY
      pos3 = x.clientX
      pos4 = x.clientY
      parent.style.top = (parent.offsetTop - pos2) + "px"
      parent.style.left = (parent.offsetLeft - pos1) + "px"
    }

    function stopDragging() {
      document.onmouseup = null
      document.onmousemove = null
    }
  }

  formatTime(data, begin) {
    if (!isFinite(data) && begin) {
      return "LIVE"
    }
    var result = new Date(data * 1000).toISOString().substr(11, 8)
    if (!begin) {
      return `${result.substr(0, 2)}:${result.substr(3, 2)}`
    } else {
      return `${result.substr(3, 2)}:${result.substr(6, 2)}`
    }
  }

  displayEpoch(data) {
    var date = Date.now() / 1000
    var time = {
      now: data.reverse ? data.time - date: date - data.time,
      day: 86400,
      hour: 3600,
      minute: 60
    }
    var result = {
      d: Math.floor(time.now / time.day),
      h: Math.floor((time.now % time.day) / time.hour),
      m: Math.floor((time.now % time.hour) / time.minute),
      s: Math.floor(time.now % time.minute)
    }
    var convert = Object.keys(result).map(x => {
      return result[x] > 0 ? result[x] + x: ""
    }).filter(x => x)
    if (data.reverse && data.alert && result.d < 3) {
      this.setNotice({enable: true, icon: "clock", color: "var(--theme-passive)", content: `Your Chatango Premium expires in ${convert.join(" ")}`})
    }
    return convert.length ? convert.join(" "): data.response
  }

  premiumEpoch(data) {
    var format = new Date(parseFloat(data.time) * 1000)
    var today = new Date()
    var compare = today.toDateString()
    var time = format.toLocaleString("en-us", {hour: "2-digit", minute: "2-digit", hour12: data.full})
    if (format.toDateString() == compare) {
      return `${data.response} ${time}`
    } else {
      var month = format.toLocaleString("en-us", {month: "short", day: "numeric"}) + ", "
      var clock = format.toLocaleString("en-us", {year: "numeric", hour: "2-digit", minute: "2-digit", hour12: !data.full})
      return `${data.response} ${month + clock}`
    }
  }

  convertEpoch(data) {
    var format = new Date(parseFloat(data.time) * 1000)
    var today = new Date()
    var compare = today.toDateString()
    var time = format.toLocaleString("en-us", {hour: "2-digit", minute: "2-digit", hour12: data.full})
    if (format.toDateString() == compare) {
      return data.deleted ? "Deleted at " + time: `${data.response} ${time}`
    } else {
      if ((today - format) / (24 * 60 * 60 * 1000) >= 2) {
        var month = format.toLocaleString("en-us", {month: "short", day: "numeric"}) + ", "
        var clock = format.toLocaleString("en-us", {year: "numeric", hour: "2-digit", minute: "2-digit", hour12: !data.full})
        return data.deleted ? "Deleted " + month + clock: data.extra ? `${data.response} ${month + clock}`: month + clock
      } else {
        return data.deleted ? "Deleted yesterday at " + time: `${data.yesterday} ${time}`
      }
    }
  }

  embedAudio(link, node, force) {
    var source = node.querySelector(`[href="${link}"]`)
    var domain = document.createElement("a")
    domain.className = "application-audio-name"
    domain.href = link
    var file = domain.pathname.split("/").slice(-1)[0]
    domain.textContent = file
    domain.onclick = x => {
      x.preventDefault()
      this.externalWarning({url: link})
    }
    var host = domain.hostname.split(".").slice(-2).join(".")
    var whitelist = !torch.mirror.includes(domain.hostname) && !this.cache.whitelist.includes(host) || !client.settings.safety.media.proxy_media
    if (whitelist && !force) {
      source.onclick = x => {
        x.preventDefault()
        client.externalWarning({url: link, node: node, type: "audio"})
      }
      return
    }
    var player = document.createElement("div")
    player.className = "application-audio"
    var header = document.createElement("div")
    header.className = "application-audio-header"
    var icon = document.createElement("span")
    icon.className = "application-audio-icon fa-solid fa-file-audio"
    header.appendChild(icon)
    header.appendChild(domain)
    var option = document.createElement("span")
    option.className = "application-audio-option"
    var download = document.createElement("span")
    download.className = "application-audio-item application-audio-extra fa-solid fa-download"
    download.onclick = () => {
      var link = document.createElement("a")
      link.href = link
      link.target = "_blank"
      link.download = file
      link.click()
      /* DIRECT DOWNLOAD
      fetch(link).then(async response => {
        var blob = await response.blob()
        var link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = file
        link.click()
      })
      */
    }
    option.appendChild(download)
    var remove = document.createElement("span")
    remove.className = "application-audio-item application-audio-extra fa-solid fa-x"
    remove.onclick = () => {
      var redo = document.createElement("a")
      redo.href = link
      redo.target = "_blank"
      redo.onclick = x => {
        x.preventDefault()
        client.externalWarning({url: link, node: node, type: "audio"})
      }
      redo.textContent = link
      player.replaceWith(redo)
      audio.pause()
    }
    option.appendChild(remove)
    header.appendChild(option)
    player.appendChild(header)
    var control = document.createElement("div")
    control.className = "application-audio-controls"
    var play = document.createElement("span")
    play.className = "application-audio-item application-audio-play fa-solid fa-spinner fa-spin"
    play.onclick = x => {
      if (!audio.paused) {
        audio.pause()
        x.currentTarget.className = "application-audio-item application-audio-play fa-solid fa-play"
      } else {
        audio.play()
        x.currentTarget.className = "application-audio-item application-audio-play fa-solid fa-pause"
      }
    }
    control.appendChild(play)
    var time = document.createElement("div")
    time.className = "application-audio-time"
    var elapsed = document.createElement("span")
    elapsed.className = "application-audio-elapsed"
    elapsed.textContent = "--:--"
    time.appendChild(elapsed)
    var divide = document.createElement("span")
    divide.textContent = "/"
    time.appendChild(divide)
    var duration = document.createElement("span")
    duration.className = "application-audio-duration"
    duration.textContent = "--:--"
    time.appendChild(duration)
    control.appendChild(time)
    var progress = document.createElement("div")
    progress.className = "application-audio-progress"
    var range = document.createElement("input")
    range.type = "range"
    range.value = 0
    range.min = 0
    range.step = 0.01
    range.onchange = x => {
      audio.currentTime = (audio.duration || 0) * (x.currentTarget.value / 100)
      if (!audio.paused) {
        audio.play()
        play.className = "application-audio-item application-audio-play fa-solid fa-pause"
      }
    }
    progress.appendChild(range)
    control.appendChild(progress)
    var volume = document.createElement("span")
    volume.className = "application-audio-item fa-solid fa-volume-high"
    volume.onclick = x => {
      switch (audio.volume) {
        case 0:
          audio.volume = 1
          volume.className = "application-audio-item fa-solid fa-volume-high"
          break;
        case 0.5:
          audio.volume = 0
          volume.className = "application-audio-item fa-solid fa-volume-xmark"
          break;
        case 1:
          audio.volume = 0.5
          volume.className = "application-audio-item fa-solid fa-volume-low"
          break;
        default:
          audio.volume = 0.5
      }
    }
    control.appendChild(volume)
    var repeat = document.createElement("span")
    repeat.className = "application-audio-item fa-solid fa-repeat"
    repeat.onclick = x => {
      if (audio.loop) {
        audio.loop = false
        x.currentTarget.removeAttribute("style")
      } else {
        if (audio.ended) {
          audio.play()
          play.className = "application-audio-item application-audio-play fa-solid fa-pause"
        }
        audio.loop = true
        x.currentTarget.style.color = "var(--theme-text-title)"
      }
    }
    control.appendChild(repeat)
    var external = document.createElement("span")
    external.className = "application-audio-item fa-solid fa-arrow-up-right-from-square"
    external.onclick = x => {
      preload.pause()
      var state = node.getBoundingClientRect()
      var top = (state.top - 49) < 0 ? 0: (state.top - 49)
      this.renderWindow({
        id: "audio",
        title: file,
        icon: "file-audio",
        width: "50vw",
        height: "23vh",
        top: `${top}px`,
        left: "130px",
        resize: "none",
        page: {
          audio: false
        }
      })
      document.querySelector('[data-window="audio"]').querySelector('[data-page="Audio"]').replaceChildren(player)
      audio.pause()
    }
    control.appendChild(external)
    player.appendChild(control)
    var audio = document.querySelector(`[data-preload="audio"] [src="${link}"]`)
    if (audio) {
      if (!isFinite(audio.duration)) {
        download.classList.add("display-none")
        repeat.classList.add("display-none")
      }
      elapsed.textContent = "00:00"
      duration.textContent = this.formatTime(audio.duration, true)
      play.className = "application-audio-item fa-solid fa-play"
    } else {
      var audio = document.createElement("audio")
      audio.controls = true
      audio.src = link
      document.querySelector('[data-preload="audio"]').appendChild(audio)
      audio.onerror = () => {
        player.outerHTML = `<a href="${link}" target="_blank" onclick="client.externalWarning({url: this.href}); return false">${link}</a>`
      }
      audio.onloadedmetadata = () => {
        if (!isFinite(audio.duration)) {
          download.classList.add("display-none")
          repeat.classList.add("display-none")
        }
        elapsed.textContent = "00:00"
        duration.textContent = this.formatTime(audio.duration, true)
        play.className = "application-audio-item fa-solid fa-play"
      }
    }
    audio.ontimeupdate = () => {
      if (isFinite(audio.duration)) {
        var time = (audio.currentTime / audio.duration) * 100
      } else {
        var time = (audio.currentTime / audio.currentTime) * 100
      }
      range.value = time
      elapsed.textContent = this.formatTime(audio.currentTime * 60)
    }
    audio.onended = () => {
      play.className = "application-audio-item fa-solid fa-arrow-rotate-left"
    }
    if (source) {
      source.replaceWith(player)
    } else {
      setTimeout(function() {
        var source = node.querySelector(`[href="${link}"]`)
        if (source) {source.replaceWith(player)}
      }, 1000)
    }
  }

  displayToast(data) {
    var toasty = document.createElement("div")
  }

  refocusWindow() {
    var select = document.querySelector(".chat-window-focus")
    if (select) {
      select.classList.remove("chat-window-focus")
    }
  }

  renderWindow(data) {
    var attach = document.querySelector(".application-content").querySelector(`[data-window="${data.id}"]`)
    if (!attach) {
      this.refocusWindow()
      var simulate = document.createElement("div")
      simulate.className = "application-chat-window chat-window-focus"
      if (data.width) {
        simulate.style.width = data.width
      }
      if (data.height) {
        simulate.style.height = data.height
      }
      if (data.resize) {
        simulate.style.resize = data.resize
      }
      if (data.top) {
        simulate.style.top = data.top
      }
      if (data.left) {
        simulate.style.left = data.left
      }
      simulate.setAttribute("data-window", data.id)
      simulate.setAttribute("tabindex", 0)
      simulate.onmousedown = x => {
        this.refocusWindow()
        x.currentTarget.classList.add("chat-window-focus")
      }
      simulate.onfocus = simulate.onmousedown
      var header = document.createElement("div")
      header.className = "chat-window-header"
      var icon = document.createElement("span")
      icon.className = data.icon == "youtube" ? `chat-window-icon fa-brands fa-youtube`: `chat-window-icon fa-solid fa-${data.icon}`
      header.appendChild(icon)
      var title = document.createElement("span")
      title.className = "chat-window-title"
      title.textContent = data.title
      header.appendChild(title)
      var menu = document.createElement("span")
      menu.className = data.buttons ? "chat-window-menu fa-solid fa-bars": "chat-window-menu fa-solid fa-x"
      menu.onclick = x => {
        if (!data.buttons && data.toggle) {
          x.currentTarget.parentNode.parentNode.classList.add("display-none")
        } else if (document.activeElement) {
          var active = document.activeElement.classList.contains("chat-window-menu")
          if (active) {
            x.currentTarget.blur()
          } else {
            x.currentTarget.focus()
          }
        } else {
          x.currentTarget.focus()
        }
      }
      menu.onfocus = x => {
        if (data.buttons) {
          x.currentTarget.nextElementSibling.classList.remove("display-none")
        } else if (data.toggle) {
          x.currentTarget.parentNode.parentNode.classList.remove("display-none")
        } else {
          x.currentTarget.parentNode.parentNode.remove()
        }
      }
      menu.onblur = x => {
        if (data.buttons) {
          x.currentTarget.nextElementSibling.classList.add("display-none")
        }
      }
      menu.onkeydown = x => {
        if (x.code == "ArrowUp") {
          x.preventDefault()
          var previous = x.currentTarget.nextElementSibling.querySelector(".window-option-select")
          if (!previous) {
            var sibling = x.currentTarget.nextElementSibling.querySelectorAll(".window-option-item")
            Array.from(sibling).slice(-1)[0].classList.add("window-option-select")
          } else if (previous.previousElementSibling) {
            previous.classList.remove("window-option-select")
            previous.previousElementSibling.classList.add("window-option-select")
          } else {
            previous.classList.remove("window-option-select")
            var sibling = x.currentTarget.nextElementSibling.querySelectorAll(".window-option-item")
            Array.from(sibling).slice(-1)[0].classList.add("window-option-select")
          }
        } else if (x.code == "ArrowDown") {
          x.preventDefault()
          var next = x.currentTarget.nextElementSibling.querySelector(".window-option-select")
          if (!next) {
            x.currentTarget.nextElementSibling.firstElementChild.classList.add("window-option-select")
          } else if (next.nextElementSibling) {
            next.classList.remove("window-option-select")
            next.nextElementSibling.classList.add("window-option-select")
          } else {
            next.classList.remove("window-option-select")
            x.currentTarget.nextElementSibling.querySelector(".window-option-item").classList.add("window-option-select")
          }
        } else if (x.code == "Enter") {
          var select = x.currentTarget.nextElementSibling.querySelector(".window-option-select")
          if (select) {
            select.click()
          } else if (!data.buttons && data.toggle) {
            x.currentTarget.parentNode.parentNode.classList.add("display-none")
          }
        }
      }
      menu.setAttribute("tabindex", 0)
      header.appendChild(menu)
      var option = document.createElement("div")
      option.className = "chat-window-option display-none"
      var minimize = document.createElement("span")
      minimize.className = "window-option-item"
      minimize.textContent = "Close"
      minimize.setAttribute("tabindex", 0)
      minimize.onclick = x => {
        x.target.classList.remove("window-option-select")
        x.currentTarget.parentNode.classList.toggle("display-none")
        x.currentTarget.parentNode.parentNode.parentNode.classList.toggle("display-none")
      }
      option.appendChild(minimize)
      if (data.buttons) {
        Object.keys(data.buttons).forEach(x => {
          var item = document.createElement("span")
          item.className = "window-option-item"
          item.textContent = x
          item.setAttribute("data-button", x)
          item.setAttribute("tabindex", 0)
          item.onclick = y => {
            data.buttons[x](y.currentTarget)
          }
          item.onkeydown = y => {
            if (y.code == "Space") {
              y.currentTarget.click()
            }
          }
          option.appendChild(item)
        })
      }
      header.appendChild(option)
      simulate.appendChild(header)
      var wrapper = document.createElement("div")
      wrapper.className = "chat-window-content"
      Object.keys(data.page).forEach((x, y) => {
        var capital = x[0].toUpperCase() + x.slice(1)
        var content = document.createElement("div")
        content.className = y == 0 ? "chat-window-page display-block": "chat-window-page"
        if (data.page[x]) {
          content.textContent = data.page[x]
        }
        content.setAttribute("data-page", capital)
        wrapper.appendChild(content)
      })
      simulate.appendChild(wrapper)
      document.querySelector(".application-content").appendChild(simulate)
      this.attachDrag(header)
    } else {
      if (data.toggle) {
        attach.classList.toggle("display-none")
        var active = attach.classList.contains("display-none")
        if (!active) {
          this.refocusWindow()
          attach.classList.add("chat-window-focus")
        }
      } else {
        attach.classList.remove("display-none")
        attach.classList.add("chat-window-focus")
        if (data.page && data.page.getAttribute && data.page.getAttribute("data-button")) {
          data.page.parentNode.classList.toggle("display-none")
          var page = data.page.getAttribute("data-button")
          var previous = attach.querySelector(".chat-window-content").querySelector(".display-block").getAttribute("data-page")
          var button = attach.querySelector(".chat-window-option").querySelector(`[data-button="${page}"]`)
          var before = button.cloneNode()
          button.setAttribute("data-icon", attach.querySelector(".chat-window-icon").classList[2])
          button.setAttribute("data-title", attach.querySelector(".chat-window-title").textContent)
          button.textContent = previous
          button.setAttribute("data-button", previous)
          attach.querySelector(".chat-window-content").querySelector(".display-block").classList.toggle("display-block")
          attach.querySelector(".chat-window-content").querySelector(`[data-page="${page}"]`).classList.toggle("display-block")
          var icon = before.getAttribute("data-icon")
          if (icon) {
            attach.querySelector(".chat-window-icon").className = `chat-window-icon fa-solid ${icon}`
          } else {
            attach.querySelector(".chat-window-icon").className = `chat-window-icon fa-solid fa-${data.icon}`
          }
          var title = before.getAttribute("data-title")
          if (title) {
            attach.querySelector(".chat-window-title").textContent = title
          } else {
            attach.querySelector(".chat-window-title").textContent = data.title
          }
        } else {
          attach.querySelector(".chat-window-title").textContent = data.title
        }
      }
    }
    document.querySelector(".chat-window-focus").focus()
  }

  attachPress(data, timeout, callback) {
    var touch = false
    data.oncontextmenu = x => {
      if (window.innerWidth <= 680) {
        x.preventDefault()
      }
    }
    data.ontouchstart = x => {
      data.style.backgroundColor = "var(--theme-secondary)"
      touch = setTimeout(y => {
        touch = null
        x.stopPropagation()
        callback(x.target)
        data.removeAttribute("style")
      }, timeout)
    }
    data.ontouchend = () => {
      data.removeAttribute("style")
      if (touch) {
        clearTimeout(touch)
      }
    }
    data.ontouchmove = () => {
      data.removeAttribute("style")
      if (touch) {
        clearTimeout(touch)
      }
    }
  }

  /*
  var uF = /sm:\/\//,
  vF = /((https?:\/\/)?[^ ]+\.(?:jpg|jpeg|png|bmp|gif))/g,
  wF = /img:\/\/(?:cam|lib):([A-Za-z0-9_-]+)/,
  xF = /vid:\/\/yt:([^"&?\/ ]{11})/;

  return '<i s="' + a + '" />' - images
  return '<i s="vid://yt:' + b + '" w="126" h="93"/>' - yt vids
  */

  parseEmoji(data) {
    var entity = Object.keys(chatango.emojis).map(x => {return x.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})
    var string = new RegExp(`((?<![^>\\s])(${entity.join("|")})(\\+\d+)?(\\?[^<\\s]*)?([^\\s<]*))`, "g")
    var emote = new RegExp(`(?<![^>\\s])(${entity.join("|")})(\\+\d+)?(\\?[^<\\s]*)?([^\\s<]*)`)
    return data.replaceAll(string, x => {
      console.log(x)
      var emoji = x.match(emote) ? x.match(emote)[1]: false
      var convert = emoji in chatango.emojis ? chatango.emojis[emoji]: false
      if (convert) {
        var face = document.querySelector('[data-preload="emojis"]').querySelector(`.emoji-item-${convert}`)
        var premium = face.getAttribute("data-premium")
        if (![200, 210].includes(client.private.premium.status) && premium) {
          return x
        }
        var tag = `<i s="sm://${convert}" w="16" h="16"/>`
        var pixel = x.match(/\+(\d+)/)
        if (pixel) {
          var value = pixel[1] > 50 ? "50": pixel[1] < 16 ? "16": pixel[1]
          var height = value
          if (pixel[2]) {
            height = pixel[2] > 50 ? "50": pixel[2] < 16 ? "16": pixel[2]
          }
          tag = `<i s="sm://${convert}" w="${value}" h="${height}"/>`
        }
        return tag
      } else {
        return x
      }
    })
  }

  renderEmoji(data, flag) {
    var entity = Object.keys(chatango.emojis).map(x => {return x.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})
    var tag = [...new Set(Object.values(chatango.emojis))]
    var string = new RegExp(`((?<![^>\\s])(${entity.join("|")})(\\+\d+)?(\\?[^<\\s]*)?([^\\s<]*))|<i .*sm:\\/\\/(${tag.join("|")}).*\/>`, "g")
    var emote = new RegExp(`(?<![^>\\s])(${entity.join("|")})(\\+\d+)?(\\?[^<\\s]*)?([^\\s<]*)`)
    var tags = new RegExp(`<i (?=.*s="sm:\/\/(${tag.join("|")})").*\/>`)
    return data.replaceAll(string, x => {
      var emoji = x.match(emote) ? x.match(emote)[1]: x.match(tags) ? x.match(tags)[1]: false
      var convert = emoji in chatango.emojis ? chatango.emojis[emoji]: Object.values(chatango.emojis).indexOf(emoji) >= 0 ? emoji: false
      if (convert) {
        var face = document.querySelector('[data-preload="emojis"]').querySelector(`.emoji-item-${convert}`)
        var premium = face.getAttribute("data-premium")
        if (!flag.includes("PREMIUM") && premium) {
          return x
        }
        var clone = face.cloneNode(true)
        if (convert == "stripes") {
          clone = chatango.renderStripes(x)
        } else {
          clone.querySelectorAll("[id]").forEach(y => {
            var previous = y.getAttribute("id")
            var identifier = `e${Math.floor(Math.random() * 1E16)}`
            y.setAttribute("id", identifier)
            var overwrite = y.parentNode.parentNode.querySelector(`[fill="url(#${previous})"]`) || y.parentNode.parentNode.querySelector(`[stroke="url(#${previous})"]`)
            overwrite.setAttribute("fill", `url(#${identifier})`)
          })
        }
        var pixel = x.match(/\+(\d+)/) || x.match(/<i (?=.*w="([\d.]+)?")(?=.*h="([\d.]+)?").*\/>/)
        if (pixel) {
          var value = pixel[1] > 50 ? "50px": pixel[1] < 16 ? "16px": `${pixel[1]}px`
          if (pixel[2]) {
            var height = pixel[2] > 50 ? "50px": pixel[2] < 16 ? "16px": `${pixel[2]}px`
            clone.style.height = height
          } else {
            clone.style.height = value
          }
          clone.style.width = value
        }
        var separator = document.createElement("span")
        separator.className = "chat-message-separator"
        separator.textContent = x
        return separator.outerHTML + clone.outerHTML
      } else {
        return x
      }
    })
  }

  renderVideo(data, query, source, tag, identifier, original) {
    var you = source.cloneNode()
    var state = source.getBoundingClientRect()
    var thumb = document.createElement("img")
    thumb.className = "video-player-thumb"
    thumb.src = data.thumbnail_url
    thumb.loading = "lazy"
    var top = (state.top - 49) < 0 ? 0: (state.top - 49)
    client.renderWindow({
      id: "youtube",
      title: data.title,
      icon: "youtube",
      width: "420px",
      height: "286px",
      top: `${top}px`,
      left: "130px",
      resize: "none",
      page: {
        youtube: false
      }
    })
    if (source.tagName != "IMG") {
      var iframe = source.cloneNode()
    } else {
      var iframe = document.createElement("iframe")
      iframe.className = "video-player-frame"
      if (query) {iframe.src = `https://www.youtube-nocookie.com/embed/${tag}?${query}&autoplay=1&modestbranding=1&playsinline=1`}
      else {iframe.src = `https://www.youtube-nocookie.com/embed/${tag}?autoplay=1&modestbranding=1&playsinline=1`}
      iframe.allow = "autoplay; encrypted-media"
      iframe.setAttribute("allowfullscreen", true)
    }
    document.querySelector('[data-window="youtube"]').querySelector('[data-page="Youtube"]').replaceChildren()
    document.querySelector('[data-window="youtube"]').querySelector('[data-page="Youtube"]').appendChild(iframe)
    source.parentNode.replaceChild(thumb, source)
  }

  renderPlayer(data, link, video, node) {
    var parameters = ""
    var parameter = {
      start: link.match(/t=(\d+)/),
      list: link.match(/list=([\w-]+)/i)
    }
    for (var x in parameter) {
      if (parameter[x]) {
        if (!parameters) {parameters += `${x}=${parameter[x][1]}`}
        else {parameters += `&${x}=${parameter[x][1]}`}
      }
    }
    var player = document.createElement("div")
    player.className = "video-player"
    var header = document.createElement("div")
    header.className = "video-player-header"
    var title = document.createElement("div")
    title.className = "video-player-title"
    title.textContent = data.title
    title.onclick = function() {
      client.externalWarning({url: link})
      return false
    }
    header.appendChild(title)
    var embed = document.createElement("span")
    embed.className = "video-player-close fa-solid fa-x"
    embed.onclick = function() {
      this.parentNode.parentNode.outerHTML = `<a href="${link}" target="_blank" onclick="client.externalWarning({url: this.href}); return false">${link}</a>`
    }
    header.appendChild(embed)
    player.appendChild(header)
    var author = document.createElement("div")
    author.className = "video-player-author"
    author.textContent = "Uploaded by " + data.author_name
    author.onclick = function() {
      client.externalWarning({url: data.author_url})
      return false
    }
    player.appendChild(author)
    var wrapper = document.createElement("div")
    wrapper.className = "video-player-wrapper"
    var loading = document.createElement("div")
    loading.className = "video-player-loading"
    wrapper.appendChild(loading)
    var option = document.createElement("div")
    option.className = "video-player-option"
    var options = ["play", "arrow-up-right-from-square"]
    options.forEach(x => {
      var button = document.createElement("span")
      button.className = `video-player-button fa-solid fa-${x}`
      if (x == "play") {
        button.onclick = function() {
          var thumb = this.parentNode.parentNode.querySelector("img")
          if (thumb) {
            var loading = this.parentNode.parentNode.querySelector(".video-player-loading")
            if (!loading) {
              var loader = document.createElement("div")
              loader.className = "video-player-loading"
              this.parentNode.parentNode.querySelector(".video-player-option").insertAdjacentElement("beforebegin", loader)
            }
            this.parentNode.parentNode.querySelector(".video-player-option").style.display = "none"
            this.parentNode.parentNode.querySelector(".video-player-option").firstElementChild.className = "video-player-button fa-solid fa-rotate-right"
            var spinner = document.createElement("span")
            spinner.className = "content-loading fa-solid fa-spinner"
            this.parentNode.parentNode.querySelector(".video-player-loading").appendChild(spinner)
            this.parentNode.parentNode.querySelector(".video-player-loading").style.opacity = 1
            var iframe = document.createElement("iframe")
            iframe.className = "video-player-frame"
            if (parameters) {iframe.src = `https://www.youtube-nocookie.com/embed/${video}?${parameters}&autoplay=1&modestbranding=1&playsinline=1`}
            else {iframe.src = `https://www.youtube-nocookie.com/embed/${video}?autoplay=1&modestbranding=1&playsinline=1`}
            iframe.allow = "autoplay; encrypted-media"
            iframe.setAttribute("allowfullscreen", true)
            iframe.onload = function() {
              this.parentNode.querySelector(".video-player-loading").remove()
              this.parentNode.querySelector(".video-player-option").style.removeProperty("display")
            }
            this.parentNode.parentNode.replaceChild(iframe, thumb)
          } else {
            this.parentNode.parentNode.querySelector(".video-player-option").style.display = "none"
            var loader = document.createElement("div")
            loader.className = "video-player-loading"
            loader.style.opacity = 1
            var spinner = document.createElement("span")
            spinner.className = "content-loading fa-solid fa-spinner"
            loader.appendChild(spinner)
            this.parentNode.parentNode.querySelector(".video-player-option").insertAdjacentElement("beforebegin", loader)
            var original = this.parentNode.parentNode.querySelector("iframe")
            var clone = this.parentNode.parentNode.querySelector("iframe").cloneNode()
            clone.onload = function() {
              this.parentNode.querySelector(".video-player-loading").remove()
              this.parentNode.querySelector(".video-player-option").style.removeProperty("display")
            }
            this.parentNode.parentNode.replaceChild(clone, original)
          }
        }
      } else if (x == "arrow-up-right-from-square") {
        button.onclick = function() {
          var playing = this.parentNode.parentNode.querySelector("iframe")
          var identifier = this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.getAttribute("data-message")
          if (playing) {
            client.renderVideo(data, parameters, playing, video, identifier, this.parentNode.parentNode)
          } else {
            client.renderVideo(data, parameters, this.parentNode.parentNode.querySelector("img"), video, identifier, this.parentNode.parentNode)
          }
        }
      }
      option.appendChild(button)
      wrapper.appendChild(option)
    })
    var thumbnail = document.createElement("img")
    thumbnail.className = "video-player-thumb"
    thumbnail.src = data.thumbnail_url
    thumbnail.alt = link
    thumbnail.loading = "lazy"
    wrapper.appendChild(thumbnail)
    player.appendChild(wrapper)
    var brand = document.createElement("a")
    brand.className = "video-player-brand"
    brand.href = "https://www.youtube.com/"
    brand.target = "_blank"
    brand.setAttribute("onclick", "client.externalWarning({url: this.href}); return false")
    var logo = document.createElement("span")
    logo.className = "video-player-logo fa-brands fa-youtube"
    brand.appendChild(logo)
    var tube = document.createElement("span")
    tube.className = "video-player-name"
    tube.textContent = "YouTube"
    brand.appendChild(tube)
    player.appendChild(brand)
    var source = node.querySelector(`[href="${link}"]`)
    if (source) {
      source.replaceWith(player)
    } else {
      setTimeout(function() {
        var source = node.querySelector(`[href="${link}"]`)
        if (source) {source.replaceWith(player)}
      }, 1000)
    }
  }

  renderYouTube(link, video, node) {
    if (video in this.cache.youtube) {
      if (this.cache.youtube[video]) {
        this.renderPlayer(this.cache.youtube[video], link, video, node)
      } else {
        setTimeout(() => {
          if (this.cache.youtube[video]) {
            client.renderPlayer(client.cache.youtube[video], link, video, node)
          }
        }, 5000)
      }
    } else {
      this.cache.youtube[video] = false
      fetch(`https://www.youtube.com/oembed?url=${link}&format=json`).then(async response => {
        if (response.status == 200) {
          var data = await response.json()
          this.cache.youtube[video] = data
          this.renderPlayer(data, link, video, node)
        } else {
          return link
        }
      }).catch(x => {
        delete this.cache.youtube[video]
        return link
      })
    }
  }

  renderMedia(data) {
    var step = data.node ? +document.querySelector(`[data-empty="${data.id}"]`).getAttribute("data-step"): 0
    var gallery = data.node ? document.querySelector(`[data-index="${data.index}"]`).querySelectorAll(".media-window-column"): []
    var source = Object.keys(data.source)
    var column = document.createElement("div")
    column.className = "media-window-column"
    if (source.length) {
      if (!data.node) {
        gallery = [1, 2, 3].map(x => column.cloneNode())
      }
      source.forEach(x => {
        if (step > 2) {
          step = 0
        }
        var wrapper = document.createElement("div")
        wrapper.className = "media-window-item"
        var media = document.createElement("img")
        media.src = chatango.crawl(x, true)
        media.title = data.source[x]
        media.loading = "lazy"
        media.style.backgroundColor = "#999"
        media.setAttribute("data-src", x)
        media.onclick = y => {
          var appendMedia = document.querySelector('[data-preload="media"] [name="appendMedia"]')
          if (appendMedia.checked) {
            this.setPlaceholder({append: `&nbsp;${y.currentTarget.getAttribute("data-src")}&nbsp;`, focus: true})
          } else {
            this.sendMessage(y.currentTarget.getAttribute("data-src"))
          }
        }
        media.onload = () => {
          media.removeAttribute("style")
          if (x.endsWith(".gif")) {
            this.firstFrame(media)
          }
        }
        media.onerror = () => {
          media.title = "Failed to load, it may have been deleted."
          media.height = 70
        }
        wrapper.appendChild(media)
        var favorite = document.createElement("span")
        if (data.skip) {
          favorite.className = "media-window-action fa-solid fa-star"
          favorite.setAttribute("data-favorite", true)
        } else {
          client.checkMedia(x).then(y => {
            if (y) {
              favorite.className = "media-window-action fa-solid fa-star"
              favorite.setAttribute("data-favorite", true)
            } else {
              favorite.className = "media-window-action fa-regular fa-star"
            }
          })
        }
        favorite.onmouseenter = y => {
          if (!y.currentTarget.getAttribute("data-favorite")) {
            y.currentTarget.classList.remove("fa-regular")
            y.currentTarget.classList.add("fa-solid")
          }
        }
        favorite.onmouseleave = y => {
          if (!y.currentTarget.getAttribute("data-favorite")) {
            y.currentTarget.classList.add("fa-regular")
            y.currentTarget.classList.remove("fa-solid")
          }
        }
        favorite.onclick = y => {
          var target = y.currentTarget.previousElementSibling
          if (target) {
            var source = target.getAttribute("src") || target.getAttribue("href")
            var favorited = y.currentTarget.getAttribute("data-favorite")
            if (favorited) {
              this.unfavoriteMedia(source)
            } else {
              this.favoriteMedia(source)
            }
          }
        }
        wrapper.appendChild(favorite)
        if (data.edit) {
         var edit = document.createElement("span")
          edit.className = "media-window-action fa-solid fa-pen"
          edit.onclick = () => {
            this.externalWarning({url: media.src, urls: [media.src], source: [x], type: "image", edit: true})
          }
          wrapper.appendChild(edit)
        }
        if (x.endsWith(".gif")) {
          var animated = document.createElement("span")
          animated.className = "media-window-action fa-solid fa-gif"
          wrapper.appendChild(animated)
        }
        gallery[step].appendChild(wrapper)
        step += 1
      })
      if (data.node) {
        document.querySelector(`[data-empty="${data.id}"]`).setAttribute("data-step", step)
      }
    }
    if (!data.node) {
      var empty = document.createElement("div")
      empty.className = "empty-item"
      empty.setAttribute("data-empty", data.id)
      empty.setAttribute("data-step", step)
      empty.textContent = data.empty
      var collage = [empty].concat(gallery)
      document.querySelector(`[data-index="${data.index}"]`).replaceChildren(...collage)
    }
  }

  messageCommand(action, data) {
    switch (action) {
      case "background":
        var target = data.length ? data[0].toLowerCase(): this.user.name
        if (this.user.name != target) {
          if (target in this.cache.background) {
            if (this.cache.blacklist.background.includes(target)) {
              this.cache.blacklist.background = this.cache.blacklist.background.filter(x => x != target)
              document.querySelector(".application-chat-wrapper").querySelectorAll(`[data-user="${target}"]`).forEach(x => {
                chatango.getBackground({username: target, node: x})
              })
            } else {
              this.cache.blacklist.background.push(target)
              document.querySelector(".application-chat-wrapper").querySelectorAll(`[data-user="${target}"]`).forEach(x => {
                x.style.removeProperty("background-color")
                x.querySelector(".chat-message-background").removeAttribute("style")
                x.querySelector(".chat-message-timestamp").style.removeProperty("color")
              })
            }
          }
        } else {
          this.user.background = !this.user.background
          this.groups[this.focus].socket.send(`msgbg:${+this.user.background}\r\n`)
        }
        break;
      case "style":
        var target = data.length ? data[0].toLowerCase(): this.user.name
        if (this.user.name != target) {
          var style = {
            b: "fontWeight",
            i: "fontStyle",
            u: "textDecoration"
          }
          if (this.cache.blacklist.style.includes(target)) {
            this.cache.blacklist.style = this.cache.blacklist.style.filter(x => x != target)
            document.querySelector(".application-chat-wrapper").querySelectorAll(`[data-user="${target}"]`).forEach(x => {
              x.querySelector(".chat-message-username").setAttribute("style", x.querySelector(".chat-message-username").getAttribute("style").replace(/([/*])/g, ""))
              x.querySelector(".chat-message-ip").style.color = x.querySelector(".chat-message-username").style.color
              x.querySelector(".chat-message-content").setAttribute("style", x.querySelector(".chat-message-content").getAttribute("style").replace(/([/*])/g, ""))
              x.querySelector(".chat-message-content").querySelectorAll("span[style]").forEach(y => {
                y.setAttribute("style", y.getAttribute("style").replace(/([/*])/g, ""))
              })
              Array.from(["b", "i", "u"]).forEach(y => {
                x.querySelector(".chat-message-content").querySelectorAll(y).forEach(z => {
                  z.removeAttribute("style")
                })
              })
            })
          } else {
            this.cache.blacklist.style.push(target)
            document.querySelector(".application-chat-wrapper").querySelectorAll(`[data-user="${target}"]`).forEach(x => {
              x.querySelector(".chat-message-username").setAttribute("style", `/*${x.querySelector(".chat-message-username").getAttribute("style")}*/`)
              x.querySelector(".chat-message-ip").style.removeProperty("color")
              x.querySelector(".chat-message-content").setAttribute("style", `/*${x.querySelector(".chat-message-content").getAttribute("style")}*/`)
              x.querySelector(".chat-message-content").querySelectorAll("span[style]").forEach(y => {
                y.setAttribute("style", `/*${y.getAttribute("style")}*/`)
              })
              Array.from(["b", "i", "u"]).forEach(y => {
                x.querySelector(".chat-message-content").querySelectorAll(y).forEach(z => {
                  z.style[style[y]] = "inherit"
                })
              })
            })
          }
        } else {
          this.user.style = !this.user.style
        }
        break;
      case "chat":
        var target = data.length ? data[0].toLowerCase(): false
        if (client.private && target) {
          client.socket("private_message", `connect:${target}`, "An ewwow occuwwed.")
        } else {
          document.querySelector('[data-sidebar="private"]').click()
        }
        break;
      case "join":
        var target = data.length ? data[0].toLowerCase(): false
        if (target) {
          document.querySelector('[data-form="join"]').querySelector('[name="group"]').value = target
          document.querySelector('[data-form="join"]').querySelector('[type="submit"]').click()
        }
        break;
      case "leave":
        var target = data.length ? data[0].toLowerCase(): false
        if (target && ![torch.environment, "community"].includes(target)) {
          client.disconnectFrom(target, true, true)
        }
        break;
      case "help":
        var target = data.length ? data[0].toLowerCase(): false
        if (target) {
          var command = target.startsWith("/") ? target.slice(1): target
          if (command in this.flags.message.commands) {
            this.systemMessage({content: this.flags.message.commands[command].description})
          } else {
            this.systemMessage({content: "Unrecognized command."})
          }
        } else {
          var commands = `/${Object.keys(this.flags.message.commands).join(", /")}`
          this.systemMessage({content: `Available commands:\r\r${commands}`})
        }
    }
  }

  messageAction(target, action, data, meta, event) {
    switch (action) {
      case "avatar":
        var avatar = chatango.getAvatar(data.username)
        client.externalWarning({url: avatar.images[0], urls: avatar.images, source: avatar.source, type: "image"})
        break;
      case "reply":
        data.flip = true
        this.setMeta(data, target, "reply", "Reply")
        this.setPlaceholder({focus: true})
        break;
      case "mention":
        this.setPlaceholder({append: ` @${meta.guest ? data.username.slice(1): data.username}&nbsp;`, focus: true})
        break;
      case "quote":
        this.setMeta(data, target, "quote-left", "Quote")
        this.setPlaceholder({focus: true})
        break;
      case "edit":
        this.editMessage(target, data)
        break;
      case "ban":
        if (meta.original) {
          data.username = target.parentNode.parentNode.parentNode.parentNode.getAttribute("data-user")
          data.ip = target.parentNode.parentNode.parentNode.parentNode.getAttribute("data-ip")
          data.session = target.parentNode.parentNode.parentNode.parentNode.getAttribute("data-session")
          meta.guest = data.username.startsWith("!") || data.username.startsWith("#")
        }
        if (event.shiftKey) {
          if (data.key) {
            this.groups[this.focus].socket.send(`delmsg:${data.key}\r\n`)
            document.querySelectorAll(`[data-edit="${data.key}"]`).forEach(x => {
              this.groups[this.focus].socket.send(`delmsg:${x.getAttribute("data-key")}\r\n`)
            })
          }
        }
        var administrator = this.user.name == this.groups[this.focus].room.owner || this.user.name in this.groups[this.focus].room.moderator && this.groups[this.focus].room.moderator[this.user.name].includes("EDIT_MODS")
        if (data.username.toLowerCase() in this.groups[this.focus].room.moderator && administrator) {
          this.groups[this.focus].socket.send(`removemod:{data.username}\r\n`)
        }
        this.groups[this.focus].socket.send(`block:${data.session}:${data.ip}:${meta.guest ? "": data.username}\r\n`)
        break;
      case "unban":
        if (meta.original) {
          data.ip = target.parentNode.parentNode.parentNode.parentNode.getAttribute("data-ip")
          data.session = target.parentNode.parentNode.parentNode.parentNode.getAttribute("data-session")
        }
        this.groups[this.focus].socket.send(`removeblock:${data.session}:${data.ip}\r\n`)
        break;
      case "delete":
        if (event.shiftKey) {
          if (data.session) {
            var guest = data.username.startsWith("!") || data.username.startsWith("#")
            this.groups[this.focus].socket.send(`delallmsg:${data.session}:${data.ip}:${guest ? "": data.username}\r\n`)
          }
        } else {
          if (data.key) {
            this.groups[this.focus].socket.send(`delmsg:${data.key}\r\n`)
            document.querySelectorAll(`[data-edit="${data.key}"]`).forEach(x => {
              this.groups[this.focus].socket.send(`delmsg:${x.getAttribute("data-key")}\r\n`)
            })
          }
        }
        break;
      case "who":
        client.systemMessage({content: `Requesting records for ${data.username}...`, avatar: "spinner", unique: "who"})
        fetch(`${torch.domain}/api/v1/who/${data.username}`).then(async response => {
          var result = await response.json()
          if (result.target) {
            var display = []
            var total = 0
            var strength = ["definite", "linked", "strong", "medium", "weak"]
            var parse = strength.forEach(x => {
              if (x in result && result[x].length) {
                display.push(`<b>${x[0].toUpperCase() + x.slice(1)}</b>\r${result[x].join(", ")}`)
                total += result[x].length
              }
            })
            if (display.length) {
              var format = `${total} total recor${total > 1 ? "ds": "d"} for <b>${result.target}</b>.\r\r${display.join("\r")}`
              client.systemMessage({content: format, avatar: "eye", unique: "who"})
            } else {
              client.systemMessage({content: `No records were found for <b>${result.target}</b>.`, avatar: "x", unique: "who"})
            }
          } else {
            client.systemMessage({content: "An error occurred.", unique: "who"})
          }
        }).catch(error => {
          client.systemMessage({content: "Could not contact server.", unique: "who"})
        })
        break;
      case "profile":
        client.externalWarning({url: chatango.link(data.username), username: data.username, type: "profile"})
        break;
      case "jump":
        var respond = document.querySelector(".application-chat-wrapper").querySelector(`[data-key="${data.key}"]`)
        if (respond) {
          var highlight = respond.classList.contains("chat-reply-highlight")
          if (highlight) {
            respond.classList.remove("chat-reply-highlight")
          }
          respond.scrollIntoView({behavior: "smooth", block: "nearest"})
          setTimeout(() => {
            respond.classList.add("chat-reply-highlight")
          }, 500)
        } else {
          var group = target.parentNode.parentNode.parentNode.parentNode.parentNode.getAttribute("data-group")
          this.setFocus({group: group, reload: true})
          setTimeout(() => {
            var respond = document.querySelector(".application-chat-wrapper").querySelector(`[data-key="${data.key}"]`)
            if (respond) {
              var highlight = respond.classList.contains("chat-reply-highlight")
              if (highlight) {
                respond.classList.remove("chat-reply-highlight")
              }
              respond.scrollIntoView({behavior: "smooth", block: "nearest"})
              setTimeout(() => {
                respond.classList.add("chat-reply-highlight")
              }, 500)
            }
          }, 1500)
        }
        break;
      case "remove":
        var parent = target.parentNode.parentNode.parentNode.parentNode
        var session = parent.getAttribute("data-session")
        if (session) {
          var parse = parseFloat(session)
          this.private.removeMessage(parse)
        }
        parent.remove()
        break;
      case "emoji":
        document.querySelector('[data-send="emojis"]').click()
        break;
      case "font":
        document.querySelector('[data-send="fonts"]').click()
        break;
      case "channel":
        document.querySelector('[data-send="channels"]').click()
        break;
      case "upload":
        var preload = document.querySelector('[data-window="upload"]')
        client.renderWindow({
          id: "upload",
          title: "Upload file",
          icon: "upload",
          width: "40vw",
          height: "26vh",
          top: "35vh",
          left: "34vw",
          toggle: true,
          page: {
            upload: false
          }
        })
        if (!preload) {
          var upload = document.querySelector('[data-preload="upload"]')
          upload.className = "chat-window-inside flex-direction-column"
          document.querySelector('[data-window="upload"]').querySelector('[data-page="Upload"]').appendChild(upload)
          document.querySelector(".upload-item-icon.fa-fire").onclick = () => {
            if (document.querySelector(".chat-send-message").contentEditable == torch.crossBrowser) {
              document.querySelector(".chat-upload").value = ""
              document.querySelector('[data-form="uploadimg"]').setAttribute("data-server", `${torch.domain}/chatango/upload`)
              document.querySelector(".chat-upload").setAttribute("accept", ".png, .apng, .jpg, .jpeg, .gif, .bmp, .webp, .mp3, .ogg, .wav, .mp4, .wmv, .webm")
              document.querySelector(".chat-upload").click()
            }
          }
          document.querySelector(".upload-item-icon.fa-message").onclick = () => {
            if (document.querySelector(".chat-send-message").contentEditable == torch.crossBrowser) {
              document.querySelector(".chat-upload").value = ""
              document.querySelector('[data-form="uploadimg"]').setAttribute("data-server", chatango.path("uploadimg"))
              document.querySelector(".chat-upload").accept = "image/*"
              document.querySelector(".chat-upload").click()
            }
          }
        }
        break;
      case "command":
        var commands = Object.keys(client.flags.message.commands)
        client.setContext(document.querySelector(".chat-more-icon"), {
          action: ["commands"].concat(commands), persist: true, height: true, expand: "calc(100vw - 348px)", top: -14, left: 10, select: true
        })
        client.setPlaceholder({insert: "/", focus: true})
        break;
      case "friend":
        client.socket("private_message", `wladd:${data.username}`, "Could not add friend")
        break;
      case "unfriend":
        client.socket("private_message", `wldelete:${data.username}`, "Could not remove friend")
        break;
      case "message":
        client.socket("private_message", `connect:${data.username}`, "An ewwow occuwwed awa")
        client.externalWarning({close: true, type: "profile"})
        break;
      case "block":
        client.socket("private_message", `block:${data.username}:${data.username}:S`, "Could not block user.")
        client.socket("private_message", `disconnect:${data.username}`, "Could not disconnect status.")
        break;
      case "unblock":
        client.socket("private_message", `unblock:${data.username}`, "Could not unblock user.")
        break;
      case "listen":
        client.cache.listen.push(data.username.toLowerCase())
        document.querySelectorAll(`.application-chat-wrapper [data-user="${data.username}" i] [data-action="Listen"]`).forEach(x => {
          x.onclick = y => {
            this.messageAction(target, "unlisten", data, meta, y)
          }
          x.setAttribute("data-action", "Unlisten")
          x.firstElementChild.className = "chat-option-icon fa-solid fa-ear-deaf"
        })
        break;
      case "unlisten":
        client.cache.listen = client.cache.listen.filter(x => x != data.username.toLowerCase())
        document.querySelectorAll(`.application-chat-wrapper [data-user="${data.username}" i] [data-action="Unlisten"]`).forEach(x => {
          x.onclick = y => {
            this.messageAction(target, "listen", data, meta, y) 
          }
          x.setAttribute("data-action", "Listen")
          x.firstElementChild.className = "chat-option-icon fa-solid fa-ear"
        })
        break;
      case "ignore":
        client.settings.safety.users.ignore.push(data.username.toLowerCase())
        var source = JSON.stringify(client.settings)
        localStorage.setItem("settings", source)
        sidebar.renderPerson({username: data.username, role: "ignored"})
        document.querySelectorAll(`.application-chat-wrapper [data-user="${data.username}" i] [data-action="Ignore"]`).forEach(x => {
          x.onclick = y => {
            this.messageAction(target, "unignore", data, meta, y)
          }
          x.setAttribute("data-action", "Unignore")
          x.firstElementChild.className = "chat-option-icon fa-solid fa-eye"
        })
        break;
      case "unignore":
        client.settings.safety.users.ignore = client.settings.safety.users.ignore.filter(x => x != data.username.toLowerCase())
        var source = JSON.stringify(client.settings)
        localStorage.setItem("settings", source)
        var item = document.querySelector(`[data-people="friends"] [data-role="ignored"] [data-target="${data.username}" i]`)
        if (item) {
          item.remove()
        }
        document.querySelectorAll(`.application-chat-wrapper [data-user="${data.username}" i] [data-action="Unignore"]`).forEach(x => {
          x.onclick = y => {
            this.messageAction(target, "ignore", data, meta, y) 
          }
          x.setAttribute("data-action", "Ignore")
          x.firstElementChild.className = "chat-option-icon fa-solid fa-eye-slash"
        })
        break;
      case "close":
        var item = document.querySelector(`[data-people="recent"] [data-target="${data.username}" i]`)
        if (item) {
          item.remove()
        }
        break;
      case "more":
        var items = Array.from(target.parentNode.children).map(x => x.getAttribute("data-action").toLowerCase())
        this.setContext(target, {action: items, height: true, top: 30, width: true, left: 20, content: data, meta: meta, event: event, toggle: true})
        break;
      case "user_status":
        var preload = document.querySelector('[data-window="status"]')
        client.renderWindow({
          id: "status",
          title: "Set status",
          icon: "moon",
          width: "300px",
          height: "50vh",
          top: "22vh",
          left: "35vw",
          toggle: true,
          page: {
            status: false
          }
        })
        if (!preload) {
          var status = document.querySelector('[data-preload="status"]')
          status.className = "chat-window-inside flex-direction-column"
          status.querySelector('[name="friendsOnly"]').onchange = x => {
            client.user.away.friendsOnly = x.currentTarget.checked
          }
          document.querySelector('[data-window="status"]').querySelector('[data-page="Status"]').appendChild(status)
        }
        this.externalWarning({close: true, type: "profile"})
        break;
      case "user_settings":
        client.previous = "userSettings"
        history.pushState({name: "userSettings"}, "", location.href)
        document.querySelector('[data-modal="userSettings"]').classList.add("modal-view")
        var notice = document.querySelector(".application-notice")
        document.querySelector('[data-modal="userSettings"] .modal-option-select').prepend(notice)
        this.externalWarning({close: true, type: "profile"})
        break;
      case "user_switch":
        alert("TODO: switch account owo")
        break;
      case "user_logout":
        alert("TODO: u r trapped here forever")
        break;
      case "group_settings":
        alert("TODO: its more complicated than u might think")
        break;
      case "group_leave":
        client.disconnectFrom(data.group, true, true)
        break;
    }
  }

  renderMention(node, data) {
    var capture = new RegExp(`(?<![^>\\s])(@${this.user.name})`, "i")
    var mentioned = data.content.match(capture)
    if (mentioned) {
      var key = node.getAttribute("data-key")
      if (key && data.group != "private_message") {
        var parent = document.querySelector('[data-preload="mentions"]')
        var exist = parent.querySelector(`[data-key="${key}"]`)
        if (!exist) {
          var group = parent.querySelector(".window-inside-subheader").textContent == `#${data.group}`
          var select = parent.querySelector(`[data-group="${data.group}"]`)
          if (!group) {
            var category = document.createElement("div")
            category.className = "window-inside-subheader"
            category.textContent = `#${data.group}`
            parent.querySelector('.window-inside-subheader').insertAdjacentElement("beforebegin", category)
            var wrapper = document.createElement("div")
            wrapper.className = "mention-wrapper"
            wrapper.setAttribute("data-group", data.group)
            var empty = document.createElement("div")
            empty.className = "empty-item"
            empty.setAttribute("data-empty", `${data.group}Mention`)
            empty.textContent = "No mentions found."
            wrapper.appendChild(empty)
            parent.querySelector(".window-inside-subheader").insertAdjacentElement("afterend", wrapper)
            select = wrapper
          }
          var jump = []
          var icon = ["jump", "more"]
          var mention = node.cloneNode(true)
          icon.forEach(x => {
            var title = x[0].toUpperCase() + x.slice(1)
            var modify = this.flags.message[x].modify && document.querySelector(".chat-send-message").contentEditable == "false"
            var option = document.createElement("div")
            option.className = this.flags.message[x].more || modify ? "chat-message-item display-none": "chat-message-item"
            option.setAttribute("data-action", title)
            if (modify) {
              option.setAttribute("data-modify", modify)
            }
            option.onclick = y => {
              y.currentTarget.parentNode.removeAttribute("style")
              this.messageAction(y.currentTarget, x, data, {guest: data.guest}, y)
            }
            //option.ontouchend = option.onclick
            option.ontouchmove = option.ontouchend = null
            var button = document.createElement("span")
            button.className = `chat-option-icon fa-solid ${this.flags.message[x].icon}`
            option.appendChild(button)
            jump.push(option)
          })
          mention.querySelector(".chat-message-option").replaceChildren(...jump)
          var inverse = {afterbegin: "beforeend", beforeend: "afterbegin"}
          if (data.flag.indexOf("BG_ON") >= 0 && data.flag.indexOf("PREMIUM") >= 0) {
            if (data.group != "private_message" && data.flag.indexOf("ANNC_ICON") >= 0 && this.settings.appearance.messages.show_bg_annc) {
              chatango.getBackground({username: this.groups[data.group].room.owner, node: mention})
            } else if (this.settings.appearance.messages.show_bg) {
              chatango.getBackground({username: data.username, node: mention})
            }
          }
          select.insertAdjacentElement(inverse[data.position], mention)
          if (data.command != "i" && !client.settings.notifications.muted.groups.includes(data.group)) {
            if (this.settings.notifications.display.tab_title) {
              var old = document.title
              document.title = `Mentioned in #${data.group}`
              setTimeout(() => {
                document.title = old
              }, 5000)
            }
            if (this.settings.notifications.sound.play_mention) {
              this.sound.message.volume = parseInt(this.settings.notifications.sound.volume_mention) / 100
              this.sound.message.play()
            }
            if (this.settings.notifications.display.push_desktop) {
              if ("Notification" in window && Notification.permission == "granted") {
                new Notification(`${data.username} in #${data.group}`, {body: data.content.replace(/<.*?>/g, ""), icon: chatango.subdomain.thumb(data.username)})
              }
            }
            if (this.settings.notifications.display.mention_recent) {
              var preload = document.querySelector('[data-window="mentions"]')
              if (preload) {
                var closed = preload.classList.contains("display-none")
                if (closed) {
                  document.querySelector('[data-toolbar="mention"]').classList.add("application-icon-mention")
                }
              } else {
                document.querySelector('[data-toolbar="mention"]').classList.add("application-icon-mention")
              }
            }
            if (this.focus != data.group && this.settings.notifications.display.mention_bubble) {
              var target = document.querySelector(".application-sidebar-content").querySelector(`[data-group="${data.group}"]`)
              target.parentNode.classList.add("sidebar-group-mention")
            }
          }
        }
      }
    }
  }

  renderMessage(data) { // p u b i br f g m atreply atquote - whitelisted tags
    if (!data.banner) {
      var parse = (data.content.match(/(<.*?>)/g) || []).join("")
      var revoke = parse.replace(/([a-f0-9]{3}|[a-f0-9]{6})=/i, "")
      var style = {
        face: parse.match(/(?:f x.*|g x.*)="([\w ]+)"|(?:f x.*|g x.*)='([\w ]+)'/) || [0, "0"],
        name: parse.match(/<n([a-f0-9]{3}|[a-f0-9]{6})\/>/i) || [0, "000"],
        size: revoke.match(/(?:f|g) x(\d{2})/) || [0, "11"],
        color: parse.match(/([a-f0-9]{3}|[a-f0-9]{6})=/i) || [0, "000"]
      }
      data.flag = data.flag.filter(x => x)
      var black = ["000", "000000"]
      var target = data.username.toLowerCase()
      var guest = target.startsWith("!") || target.startsWith("#")
      var channels = data.flag.filter(x => x.startsWith("CHANNEL"))
      if (data.group != "private_message" && !data.flag.includes("PREMIUM") && target == this.groups[data.group].room.owner) {
        data.flag.push("PREMIUM")
      }
      if (this.cache.blacklist.background.includes(target)) {
        data.flag = data.flag.filter(x => x != "BG_ON")
      }
      var capture = new RegExp(`(?<![^>\\s])(@${this.user.name})`, "i")
      var mentioned = data.content.match(capture)
      var linebreak = data.content.replaceAll("\r", "<br/>").replaceAll("\n", "<br/>").replace(/(<br\/>){2,}/g, "<br/><br/>")
      if (data.group == "private_message") {
        linebreak = linebreak.replace(/<strike>/g, "<s>").replace(/<\/strike>/g, "</s>")
      }
      var post = linebreak.replaceAll(/(?!<n[a-f0-9]{3}\/>|<n[a-f0-9]{4}\/>|<n[a-f0-9]{6}\/>|<f x[0-9]{2}[a-f0-9]+=(?:'|").*?(?:'|")>|<[biusp]>|<\/[biuspf]>|<br\/>|<atreply>|<\/atreply>|<atquote>|<\/atquote>|<i .*?\/>)(<.*?>)/gi, "").replace(/\u2593(.*?)\u2592/g, "<s>$1</s>")
      post = post.replace(/^<(?:f|g) x(\d{2})s?([a-f0-9]{6}|[a-f0-9]{3})=(?:'|")([\w ]+)?(?:'|")>(<n.*?\/>)?/i, "")
      post = post.replaceAll(/(?<!<n.{3}\/>|<n.{4}\/>|<n.{6}\/>)<(?:f|g) x(\d{2})s?([a-f0-9]{6}|[a-f0-9]{3})=(?:'|")([\w ]+)?(?:'|")>((?:(?!<f .*?>).)*)/gi, (x, size, color, family, text) => {
        if (this.settings.appearance.messages.show_style) {
          if (!family) {
            family = 0
          }
          if (family in chatango.fonts.face) {
            family = chatango.fonts.family[family].replaceAll('"', "'")
          }
          return `<span style="font-size: ${fontScale(size)}; color: #${color}; font-family: ${family};">${text}</span>`
        } else {
          return `<f x${size}${color}="${family}">${text}`
        }
      }).replace(/(<n.*?>|<f x.*?>|<g x.*?>)/gi, "")
      var item = document.createElement("div")
      item.className = "chat-message"
      item.setAttribute("tabindex", 0)
      item.setAttribute("data-user", target)
      if (data.key) {
        var identify = parse.match(/<i([a-z0-9]{7,8})\/>/)
        if (data.key == "pm") {
          if (identify) {
            item.setAttribute("data-key", `${identify[1]}=`)
          } else {
            item.setAttribute("data-key", data.timestamp)
          }
        } else {
          item.setAttribute("data-key", data.key)
        }
      }
      Array.from(["ip", "unique", "timestamp", "session"]).forEach(x => {
        if (x in data && data[x]) {
          item.setAttribute(`data-${x}`, data[x])
        }
      })
      if (this.settings.appearance.messages.format_message == 2) {
        item.setAttribute("data-appearance", "classic")
      }
      var ignoreGuest = guest && !this.settings.safety.messages.show_guest
      var ignoreBroadcast = data.flag.indexOf("ANNC_ICON") >= 0 && !this.settings.appearance.messages.show_annc
      if (this.settings.safety.users.ignore.includes(target) && target != this.user.name) {
        var ignore = parseInt(client.settings.safety.users.format_ignore)
        switch (ignore) {
          case 3:
            item.style.filter = "blur(10px)"
            item.onclick = () => {
              item.style.removeProperty("filter")
            }
            break;
          case 2:
            item.classList.add("display-none")
            break;
          default:
            item.style.height = 15
            item.style.overflow = "hidden"
            var mask = document.createElement("div")
            mask.className = "chat-message-mask"
            var text = document.createElement("span")
            text.className = "chat-message-ignore"
            text.textContent = "Message ignored"
            mask.appendChild(text)
            item.prepend(mask)
            item.onclick = () => {
              item.style.removeProperty("height")
              item.style.removeProperty("overflow")
              mask.remove()
            }
        }
      } else if (ignoreGuest || ignoreBroadcast) {
        item.classList.add("display-none")
      }
      item.style.fontSize = `${this.settings.appearance.messages.font_scale}%`
      item.onmousedown = x => {
        x.currentTarget.focus()
        //x.currentTarget.style.backgroundColor = "var(--theme-secondary)"
      }
      item.onmouseup = x => {
        //x.currentTarget.removeAttribute("style")
      }
      var background = document.createElement("div")
      background.className = "chat-message-background"
      item.appendChild(background)
      var channel = document.createElement("div")
      channel.className = "chat-message-channel"
      if (mentioned) {
        channels.unshift("CHANNEL_MENTION")
      }
      if (data.group != "private_message" && channels.length) {
        channel.setAttribute("data-channel", channels.join(" "))
        this.groups[data.group].user.channel.filtered.forEach(x => {
          if (channels.includes(`CHANNEL_${x.toUpperCase()}`) || x == "no" && !channels.filter(y => y != "CHANNEL_MENTION").length) {
            item.classList.add("display-none")
          }
        })
        if (channels.length > 1) {
          var channelValue = (100 / channels.length).toFixed(1)
          var channelSet = 0
          var finalChannel = "linear-gradient(90deg, "
          channels.forEach((x, y) => {
            var channelName = x.split("_")[1].toLowerCase()
            var channelIndex = y + 1
            if (channelName == "mod") {
              finalChannel += `transparent ${channelSet}%, transparent ${(channelValue * channelIndex).toFixed(1)}%), ${chatango.flags.channel[channelName].hex.slice(0, -1)},`
            } else {
              finalChannel += `${chatango.flags.channel[channelName].hex} ${channelSet}%, ${chatango.flags.channel[channelName].hex} ${(channelValue * channelIndex).toFixed(1)}%,`
            }
            channelSet = (channelValue * channelIndex).toFixed(1)
          })
          channel.style.background = `${finalChannel.slice(0, -1)})`
        } else {
          var channelName = channels[0].split("_")[1].toLowerCase()
          if (channelName == "mod") {
            channel.style.background = chatango.flags.channel[channelName].hex
          } else {
            channel.style.backgroundColor = chatango.flags.channel[channelName].hex
          }
        }
      } else if (data.group != "private_message" && this.groups[data.group].user.channel.filtered.includes("no")) {
        item.classList.add("display-none")
      }
      item.appendChild(channel)
      var group = target.slice(1)
      var wrapper = document.createElement("div")
      wrapper.className = "chat-message-wrapper"
      if (target == "client") {
        var picture = data.avatar || "fire"
        var avatar = document.createElement("div")
        avatar.className = `chat-message-avatar ${torch.avatar[picture].icon}`
        avatar.style.color = torch.avatar[picture].color
        avatar.style.display = "flex"
        avatar.style.fontSize = torch.avatar[picture].size || 40
        avatar.style.backgroundColor = "transparent"
        if (picture == "spinner") {
          avatar.style.animation = "rotation 1.5s linear infinite"
        }
      } else if (group in torch.groups && torch.groups[group].uid) {
        var avatar = chatango.renderIcon(group)
        guest = false
      } else {
        var quality = parseInt(this.settings.appearance.messages.quality_avatar)
        var low = [1, 2].indexOf(quality) >= 0
        var avatar = document.createElement("img")
        avatar.className = "chat-message-avatar"
        avatar.src = guest || data.pfp ? `${torch.static}/img/noimage.jpg`: low ? chatango.subdomain.thumb(target): chatango.subdomain.thumb_m(target)
        avatar.alt = `${data.username} profile picture`
        avatar.loading = "lazy"
        var pixel = [2, 4].indexOf(quality) >= 0
        if (pixel) {
          avatar.style.imageRendering = "pixelated"
        }
      }
      if (!this.settings.appearance.messages.show_avatar) {
        avatar.style.display = "none"
      }
      avatar.onclick = () => {
        this.externalWarning({url: chatango.link(target), username: data.username, type: "profile"})
      }
      wrapper.appendChild(avatar)
      var separator = document.createElement("span")
      separator.className = "chat-message-separator"
      var container = document.createElement("div")
      container.className = "chat-message-container"
      var header = document.createElement("div")
      header.className = "chat-message-header"
      var sensitive = parse.match(/<u([a-z0-9]{1,20})\/>/i)
      var character = sensitive && sensitive[1].toLowerCase() == target
      var username = document.createElement("span")
      username.className = "chat-message-username"
      username.textContent = guest && data.username.slice(1) != data.group ? data.username.slice(1): character ? sensitive[1]: data.username
      if (style.name && this.settings.appearance.messages.show_style) {
        username.style.color = data.flag.includes("BG_ON") && data.flag.includes("PREMIUM") ? `#${style.name[1]}`: !black.includes(style.name[1]) ? hexBrightness(style.name[1], "var(--theme-text-title)"): this.settings.appearance.messages.adjust_color && "var(--theme-text-title)" || style.name[1]
      }
      header.appendChild(username)
      if (this.cache.bots.verified.includes(target)) {
        data.flag.unshift("VERIFIED_BOT_ICON")
      } else if (guest && data.username.slice(1) != data.group) {
        data.flag.unshift("GUEST_ICON")
      } else if (chatango.staff.includes(target)) {
        data.flag.unshift("CHATANGO_ICON")
      }
      if (data.flag.includes("MEDIA_ON") && data.flag.includes("PREMIUM")) {
        data.flag.unshift("MEDIA_ICON")
      }
      var badges = data.flag.filter(x => x.endsWith("_ICON"))
      if (badges.includes("MOD_ICON") && badges.includes("STAFF_ICON")) {
        if (target == this.groups[data.group].room.owner) {
          badges.splice(badges.indexOf("MOD_ICON"), 2, "OWNER_ICON")
        } else {
          badges = badges.filter(x => x != "MOD_ICON")
        }
      }
      if (badges.length && this.settings.appearance.messages.show_badge) {
        var badge = document.createElement("span")
        badge.className = "chat-message-badge chat-header-item"
        badges.forEach(x => {
          var status = document.createElement("span")
          status.className = `chat-badge-item ${chatango.badges[x].icon}`
          status.setAttribute("data-badge", chatango.badges[x].label)
          if (x == "MEDIA_ICON") {
            status.onclick = () => {
              client.externalWarning({url: chatango.link(target), username: target, type: "vr"})
            }
          }
          var label = document.createElement("span")
          label.className = "chat-badge-label"
          label.textContent = status.getAttribute("data-badge")
          status.appendChild(label)
          badge.appendChild(status)
          var separate = separator.cloneNode(true)
          separate.innerHTML = `&nbsp;(${chatango.badges[x].label})`
          badge.appendChild(separate)
        })
        header.appendChild(badge)
      }
      var separateTime = separator.cloneNode(true)
      separateTime.innerHTML = "&nbsp;["
      header.appendChild(separateTime)
      var timestamp = document.createElement("span")
      timestamp.className = "chat-message-timestamp chat-header-item"
      timestamp.textContent = this.convertEpoch({time: data.timestamp, response: "Today at", yesterday: "Yesterday at", full: true})
      if (this.settings.appearance.messages.align_date == 2) {
        timestamp.style.float = "right"
      } else if (this.settings.appearance.messages.align_date == 3) {
        timestamp.style.display = "none"
      }
      timestamp.style.opacity = this.settings.appearance.messages.opacity_date / 100
      header.appendChild(timestamp)
      var separateTimeEnd = separator.cloneNode(true)
      separateTimeEnd.textContent = "]"
      header.appendChild(separateTimeEnd)
      if (data.ip) {
        var ip = document.createElement("span")
        ip.className = "chat-message-ip chat-header-item"
        var separateIP = separator.cloneNode(true)
        separateIP.innerHTML = "&nbsp;-&nbsp;"
        ip.appendChild(separateIP)
        var ipText = document.createTextNode(data.ip)
        ip.appendChild(ipText)
        if (style.name && this.settings.appearance.messages.show_style) {
          ip.style.color = data.flag.includes("BG_ON") && data.flag.includes("PREMIUM") ? `#${style.name[1]}`: !black.includes(style.name[1]) ? hexBrightness(style.name[1], "var(--theme-text-title)"): this.settings.appearance.messages.adjust_color && "var(--theme-text-title)" || style.name[1]
        }
        if (this.settings.appearance.messages.align_ip == 2) {
          ip.style.float = "right"
        } else if (this.settings.appearance.messages.align_ip == 3) {
          ip.style.display = "none"
        }
        ip.style.opacity = this.settings.appearance.messages.opacity_ip / 100
        header.appendChild(ip)
      }
      container.appendChild(header)

      var proxied = {}
      var proxy = post.replaceAll(/(?![^<]*>)(https?:\/\/[^<="\s]+\.(?:png|apng|jpg|gif|jpeg|bmp|webp)(?:\?[^<"\s]+)?)|<i (?=.*s="(https?:\/\/[^<="\s]+\.(?:png|apng|jpg|gif|jpeg|bmp|webp)(?:\?[^<"\s]+)?)").*\/>/gi, x => {
        var rng = (Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)).substr(0, 16)
        var pair = (Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)).substr(0, 16)
        proxied[rng] = pair
        return chatango.crawl(x, false, "image", rng, pair)
      })
      var secret = proxy.replaceAll(/(?![^<]*>)(https?:\/\/(?:fp\.)?chatango\.com\/pmmessageimg(?:\?[^<"\s]+)?)|<i (?=.*s="img:\/\/(?:cam|lib):([\w-]+)").*\/>/g, (x, y, z) => {
        var rng = (Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)).substr(0, 16)
        var pair = (Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)).substr(0, 16)
        proxied[rng] = pair
        var domain = z ? `https://chatango.com/pmmessageimg?i=${z}`: x
        return `<a href="${domain}" target="_blank" id="${rng}" referrerpolicy="no-referrer"><img src="${domain}" alt="${domain}" style="width: auto; max-height: 90px; max-width: 80%" loading="lazy" id="${pair}"></a>`
      })
      //var audio = secret.replaceAll(/(?![^<]*>)(https?:\/\/[^<="\s]+\.(?:mp3|ogg|wav)(?:\?[^<"\s]+)?)/g, x => chatango.crawl(x, false, "audio"))
      var video = secret.replaceAll(/(?![^<]*>)(https?:\/\/[^<="\s]+\.(?:mp4|wmv|webm)(?:\?[^<"\s]+)?)/gi, x => chatango.crawl(x, false, "video")).replaceAll(/<i (?=.*s="vid:\/\/yt:([\w-]{11})").*\/>/g, "https://youtu.be/$1")
      var hyperlink = video.replaceAll(/(?![^<]*>)(https?:\/\/[^<\s]+\.(?:[a-z])[^<"`\s]*|www\..*?[^<"`\s]+\.(?:[a-z])[^<"`\s]*)/g, x => {
        var mango = x.match(/(?![^<]*>)https?:\/\/([a-z0-9-_]{1,20})\.chatango\.com[^<"\s]*/i)
        if (mango) {
          return chatango.embed(mango[0], mango[1])
        } else {
          return `<a href="${x}" target="_blank" onclick="client.externalWarning({url: this.href}); return false">${x}</a>`
        }
      })
      var media = hyperlink.replaceAll(/(?![^<]*>)(cm:\/\/[^<"\s]*)/g, '<div class="application-profile-vr fa-solid fa-play"></div>')
      var quotes = media.replaceAll(/(@[a-z0-9]{1,20}): `(.*?)`/gi, '<code class="chat-item-quote">$1: <span class="chat-message-separator">`</span>$2<span class="chat-message-separator">`</span></code>').replaceAll(/<atquote>(.*?)<\/atquote>/gi, '<code class="chat-item-quote">$1</code>')
      var mention = quotes.replaceAll(/(?<![^>\s])(@[a-z0-9]{1,20})|<atreply>(@[a-z0-9]{1,20})<\/atreply>/gi, '<span class="chat-item-mention">$1</span>')

      var content = document.createElement("div")
      content.className = "chat-message-content"
      content.innerHTML = this.renderEmoji(mention, data.flag)
      if (data.edit) {
        content.setAttribute("contenteditable", torch.crossBrowser)
      }
      if (style.size && this.settings.appearance.messages.show_style) {
        content.style.fontSize = fontScale(style.size[1])
      }
      if (style.color && this.settings.appearance.messages.show_style) {
        content.style.color = data.flag.includes("BG_ON") && data.flag.includes("PREMIUM") ? `#${style.color[1]}`: !black.includes(style.color[1]) ? hexBrightness(style.color[1], "var(--theme-text-description)"): this.settings.appearance.messages.adjust_color && "var(--theme-text-description)" || style.color[1]
      }
      if (style.face && this.settings.appearance.messages.show_style) {
        var face = style.face[2] || style.face[1]
        if (face in chatango.fonts.face) {
          content.style.fontFamily = chatango.fonts.family[face]
        } else {
          content.style.fontFamily = `"${face}", sans-serif`
        }
      }
      container.appendChild(content)

      var more = document.createElement("div")
      more.className = "chat-message-option"
      var icon = data.action || []
      if (!data.announcement) {
        if (!icon.length) {
          if (data.ephemeral) {
            icon.push("remove", "help")
          } else if (data.client_self) {
            icon.push("avatar", "who", "profile")
          } else if (data.client_only) {
            icon.push("avatar", "reply", "who", "profile")
          } else if (guest) {
            icon.push("reply", "mention", "quote")
          } else {
            icon.push("avatar", "reply", "mention", "quote", "who", "profile")
          }
          if (this.user.name == target && !data.client_self) {
            icon.push("edit")
          }
          if (!data.ephemeral && data.group == "private_message") {
            icon.push("remove")
          }
          if (!data.ephemeral) {
            if (this.user.name != target) {
              icon.push(this.settings.safety.users.ignore.includes(target) ? "unignore": "ignore")
            }
            if (data.group != "private_message" && data.group) {
              var permission = this.user.name == this.groups[data.group].room.owner || this.groups[data.group].user.moderator
              var moderator = target == this.groups[data.group].room.owner || target in this.groups[data.group].room.moderator
              //var moderator = target == this.groups[data.group].room.owner || target in this.groups[data.group].room.moderator && this.groups[data.group].room.moderator[target].includes("EDIT_MODS")
              var administrator = this.user.name == this.groups[data.group].room.owner || this.user.name in this.groups[data.group].room.moderator && this.groups[data.group].room.moderator[this.user.name].includes("EDIT_MODS")
              if (permission) {
                if (!moderator) {
                  var banned = this.groups[data.group].room.banned.member
                  var filtered = banned.filter(x => x.includes(target) || x.includes(data.ip) || x.includes(data.session))
                  icon.push(filtered.length ? "unban": "ban")
                }
                icon.push("delete")
              }
            }
          }
        }
        icon.push("more")
      }

      icon.forEach(x => {
        if (x) {
          var title = x[0].toUpperCase() + x.slice(1)
          var modify = this.flags.message[x].modify && document.querySelector(".chat-send-message").contentEditable == "false"
          var option = document.createElement("div")
          option.className = this.flags.message[x].more || modify ? "chat-message-item display-none": "chat-message-item"
          option.setAttribute("data-action", title)
          if (modify) {
            option.setAttribute("data-modify", modify)
          }
          option.onclick = y => {
            y.currentTarget.parentNode.removeAttribute("style")
            this.messageAction(y.currentTarget, x, data, {guest: guest}, y)
          }
          //option.ontouchend = option.onclick
          option.ontouchmove = option.ontouchend = null
          var button = document.createElement("span")
          button.className = `chat-option-icon fa-solid ${this.flags.message[x].icon}`
          option.appendChild(button)
          more.appendChild(option)
        }
      })
      container.appendChild(more)
      wrapper.appendChild(container)
      this.attachPress(item, 500, x => {
        item.querySelector(".chat-message-option").style.transform = "translateY(40%)"
      })
      item.appendChild(wrapper)
      if (data.flag.indexOf("BG_ON") >= 0 && data.flag.indexOf("PREMIUM") >= 0) {
        if (data.group != "private_message" && data.flag.indexOf("ANNC_ICON") >= 0 && this.settings.appearance.messages.show_bg_annc) {
          chatango.getBackground({username: this.groups[data.group].room.owner, node: item})
        } else if (this.settings.appearance.messages.show_bg) {
          chatango.getBackground({username: data.username, node: item})
        }
      }
      var mentions = post.match(/(?<![\w]|[^>]\s])(@[a-z0-9]{1,20})/gi)
      if (!data.announcement && mentions) {
        item.querySelectorAll(".chat-item-mention").forEach(x => {
          x.onclick = () => {
            client.setPlaceholder({append: ` ${x.textContent}&nbsp;`, focus: true})
          }
        })
      }

      if (data.command == "b" || data.command == "u") {
        this.displayEdit(data, item, true)
        this.displayReply(data, item)
      } else {
        setTimeout(() => {
          this.displayEdit(data, item, false)
        }, 500)
        setTimeout(() => {
          this.displayReply(data, item)
        }, 800)
      }

      Object.keys(proxied).forEach(x => {
        var attachment = item.querySelector(`[id="${x}"]`)
        if (attachment) {
          if (attachment.href.endsWith(".gif") && !client.settings.media.content.autoplay_gif) {
            attachment.firstElementChild.onload = () => {
              client.firstFrame(attachment.firstElementChild)
            }
          }
          attachment.onclick = y => {
            if (y.currentTarget.firstElementChild) {
              var images = y.currentTarget.parentNode.parentNode.querySelectorAll("a[id]")
              var urls = Array.from(images).map(x => x.firstElementChild.src).filter(x => x != y.currentTarget.firstElementChild.src)
              var first = [y.currentTarget.firstElementChild.src].concat(urls)
              var original = Array.from(images).map(x => x.href).filter(x => x != y.currentTarget.href)
              var second = [y.currentTarget.href].concat(original)
              client.externalWarning({url: y.currentTarget.firstElementChild.src, urls: first, source: second, type: "image"})
            } else {
              client.externalWarning({url: y.currentTarget.href})
            }
            y.preventDefault()
          }
          item.querySelector(`[id="${proxied[x]}"]`).onerror = function() {
            this.parentNode.innerHTML = this.parentNode.href
          }
        }
      })

      var audios = mention.match(/(?![^<]*>)(https?:\/\/[^<="\s]+\.(?:mp3|ogg|wav)(?:\?[^<"\s]+)?)/i)
      if (audios) {
        this.embedAudio(audios[1], item)
      }
      var youtube = mention.match(/((?<![="])(?:https?:\/\/(?:(?:\w+\.)?youtube\.\w{1,3}|youtu\.be)(?:.*v=|\/\w+\/|\/)([\w-]{11})[^<\s]*))/)
      if (youtube) {
        this.renderYouTube(youtube[1].replaceAll("&amp;", "&"), youtube[2], item)
      }

      if (!this.settings.safety.users.ignore.includes(target)) {
        this.renderMention(item, Object.assign({}, {guest: guest}, data))
      }

      if (data.announcement) {
        var announce = document.querySelector('[data-option="overview"]').querySelector('[data-content="announcement"]')
        var select = announce.querySelector(".chat-message")
        if (select) {
          select.remove()
        }
        announce.appendChild(item)
      } else if (data.node) {
        return item
      } else {
        document.querySelector(".application-chat-wrapper").insertAdjacentElement(data.position, item)
      }
    } else {
      if (data.unique) {
        var overwrite = document.querySelector(".application-chat-wrapper").querySelector(`[data-banner="${data.unique}"]`)
        if (overwrite) {
          overwrite.remove()
        }
      }
      var item = document.createElement("div")
      item.className = "chat-banner-item"
      if (data.unique) {
        item.setAttribute("data-banner", data.unique)
      }
      var line = document.createElement("fieldset")
      line.className = "chat-banner-line"
      var text = document.createElement("legend")
      text.className = "chat-banner-content"
      text.textContent = data.content
      line.appendChild(text)
      item.appendChild(line)
      if (data.node) {
        return item
      } else {
        document.querySelector(".application-chat-wrapper").insertAdjacentElement(data.position, item)
      }
    }
  }

  systemMessage(data) {
    if (data.unique) {
      var overwrite = document.querySelector(".application-chat-wrapper").querySelector(`[data-unique="${data.unique}"]`)
      if (overwrite) {
        overwrite.remove()
      }
    }
    this.renderMessage({username: data.username || "Client", group: data.group || this.focus, timestamp: data.timestamp || Date.now() / 1000, content: data.content, flag: ["SYSTEM_ICON"], avatar: data.avatar || "fire", position: "beforeend", unique: data.unique, ephemeral: true})
  }

  externalWarning(data) {
    if (!data.close) {
      var domain = document.createElement("a")
      domain.href = data.url.replace(/(\w+)\/img\/t_/, "$1/img/l_")
      var host = domain.hostname.split(".").slice(-2).join(".")
      var mime = ["image", "audio", "video"]
      switch (data.type) {
        case "image":
          this.externalWarning({close: true, type: "profile"})
          document.querySelector(".external-modal").showModal()
          document.querySelector(".external-modal").setAttribute("data-external", "image")
          var gallery = []
          data.urls.forEach((x, y) => {
            var original = data.source ? data.source[y].replace(/(\w+)\/img\/t_/, "$1/img/l_"): x.replace(/(\w+)\/img\/t_/, "$1/img/l_")
            var wrapper = document.createElement("div")
            wrapper.className = !y ? "external-image-content display-block": "external-image-content"
            var image = document.createElement("img")
            image.className = "external-modal-image"
            image.src = x.replace(/(\w+)\/img\/t_/, "$1/img/l_")
            var favorite = document.createElement("span")
            this.checkMedia(original).then(z => {
              if (z) {
                favorite.className = "external-image-favorite fa-solid fa-star"
                favorite.setAttribute("data-favorite", true)
              } else {
                favorite.className = "external-image-favorite fa-regular fa-star"
              }
            })
            favorite.onmouseenter = z => {
              if (!z.currentTarget.getAttribute("data-favorite")) {
                z.currentTarget.classList.remove("fa-regular")
                z.currentTarget.classList.add("fa-solid")
              }
            }
            favorite.onmouseleave = z => {
              if (!z.currentTarget.getAttribute("data-favorite")) {
                z.currentTarget.classList.add("fa-regular")
                z.currentTarget.classList.remove("fa-solid")
              }
            }
            favorite.onclick = z => {
              var target = z.currentTarget.nextElementSibling
              if (target) {
                var favorited = z.currentTarget.getAttribute("data-favorite")
                if (favorited) {
                  this.unfavoriteMedia(target.href)
                } else {
                  this.favoriteMedia(target.href)
                }
              }
            }
            var source = document.createElement("a")
            source.href = original.replace("http://", "https://")
            source.className = "external-modal-source"
            source.target = "_blank"
            source.referrerPolicy = "no-referrer"
            source.textContent = "View original source"
            if (data.edit) {
              var form = document.createElement("form")
              form.onsubmit = z => {
                z.preventDefault()
                this.favoriteMedia(source.href, z.target.media.value)
              }
              var label = document.createElement("label")
              label.className = "field-display"
              var field = document.createElement("span")
              field.className = "text-field"
              var text = document.createElement("input")
              text.type = "text"
              text.name = "media"
              text.className = "text-input"
              text.value = document.querySelector(`[data-src="${original}"]`).title
              text.placeholder = document.querySelector(`[data-src="${original}"]`).title
              var save = document.createElement("button")
              save.type = "submit"
              save.className = "text-input-extra fa-solid fa-save"
              field.append(text, save)
              label.appendChild(field)
              form.appendChild(label)
              wrapper.append(image, favorite, source, form)
            } else {
              wrapper.append(image, favorite, source)
            }
            gallery.push(wrapper)
          })
          document.querySelector(".external-image-wrapper").replaceChildren(...gallery)
          document.querySelector(".external-modal-media").classList.remove("display-none")
          break;
        case "audio":
          if (!this.settings.safety.whitelist.domain.includes(domain.host) && this.settings.safety.media.warn_redirect) {
            document.querySelector(".external-modal").showModal()
            document.querySelector(".external-modal-header").textContent = "Embed link"
            document.querySelector(".external-modal-description").textContent = "This link will be embedded"
            document.querySelector(".external-modal-button").href = domain.href
            document.querySelector(".external-modal-link").textContent = domain.href
            document.querySelector(".external-modal-domain").textContent = `Trust ${domain.host}`
            document.querySelector(".external-modal-warn").classList.remove("display-none")
            document.querySelector(".external-modal-button").onclick = x => {
              x.preventDefault()
              var whitelist = document.querySelector(".external-modal-domain").previousElementSibling.checked
              if (whitelist && !client.settings.safety.whitelist.domain.includes(domain.host)) {
                client.settings.safety.whitelist.domain.push(domain.host)
              }
              document.querySelector(".external-modal-domain").previousElementSibling.checked = false
              this.embedAudio(data.url, data.node, true)
              client.externalWarning({close: true})
            }
          } else {
            this.embedAudio(data.url, data.node, true)
          }
          break;
        case "video":
          console.log("todo: check video")
          break;
        case "profile":
          document.querySelector(".external-modal").showModal()
          document.querySelector(".external-modal").setAttribute("data-external", "profile")
          var loading = document.createElement("span")
          loading.className = "content-loading fa-solid fa-spinner"
          document.querySelector(".external-modal-profile").replaceChildren(loading)
          chatango.renderMini(document.querySelector(".external-modal-profile"), {username: data.username, clean: true}).then(profile => {
            console.log("profile loaded")
          }).catch(error => {
            console.log(error)
          })
          document.querySelector(".external-modal-profile").classList.remove("display-none")
          break;
        case "avatar":
          document.querySelector(".external-modal").showModal()
          document.querySelector(".external-modal").setAttribute("data-external", "avatar")
          document.querySelector(".external-modal-avatar .external-modal-title").textContent = "Edit avatar"
          document.querySelector(".external-modal-avatar").classList.remove("display-none")
          document.querySelectorAll(".external-modal-avatar [data-button]:not([data-cancel])").forEach(x => x.disabled = true)
          var exist = document.querySelector(".external-modal-avatar .content-loading")
          if (exist) {
            break;
          }
          var loading = document.createElement("span")
          loading.className = "content-loading fa-solid fa-spinner"
          loading.style.position = "absolute"
          document.querySelector(".external-modal-avatar .external-modal-content").replaceChildren(loading)
          var wrapper = document.createElement("div")
          wrapper.style.overflow = "hidden"
          var avatar = document.createElement("img")
          avatar.className = "external-avatar-image"
          avatar.src = chatango.subdomain.full(this.user.name)
          avatar.style.visibility = "hidden"
          avatar.onload = () => {
            if (avatar.width > avatar.height) {
              wrapper.style.width = "100%"
            } else {
              wrapper.style.height = "100%"
            }
            document.querySelector(".external-modal-avatar .external-modal-content").appendChild(wrapper)
            new Cropper(avatar, {
              aspectRatio: 1,
              viewMode: 3,
              ready() {
                if (client.user.avatar) {
                  var ratio = this.cropper.imageData.width / this.cropper.imageData.naturalWidth
                  var data = client.user.avatar
                  var width = data.ts < 0 ? this.cropper.imageData.width: Math.floor(data.ts * ratio)
                  this.cropper.setCropBoxData({top: data.y0 < 0 ? 0: data.y0 * ratio, left: data.x0 < 0 ? 0: data.x0 * ratio, width: width, height: width})
                }
                document.querySelectorAll(".external-modal-avatar [data-button]").forEach(x => x.disabled = false)
                avatar.removeAttribute("style")
                document.querySelector(".external-modal-avatar .external-modal-content").replaceChildren(wrapper)
              }
            })
          }
          avatar.onerror = () => {
            avatar.src = `${torch.domain}/proxy?url=${avatar.src}`
            avatar.onerror = () => {
              var broke = document.createElement("div")
              broke.className = "sidebar-people-empty"
              var icon = document.createElement("span")
              icon.className = "application-connect-icon fa-solid fa-warning"
              icon.style.color = "var(--theme-highlight)"
              var text = document.createElement("span")
              text.className = "application-connect-text"
              text.textContent = "Avatar failed to load."
              broke.append(icon, text)
              document.querySelector(".external-modal-avatar .external-modal-content").replaceChildren(broke)
            }
          }
          wrapper.appendChild(avatar)
          break;
        case "vr":
          document.querySelector(".external-modal").showModal()
          document.querySelector(".external-modal").setAttribute("data-external", "profile")
          var loading = document.createElement("span")
          loading.className = "content-loading fa-solid fa-spinner"
          document.querySelector(".external-modal-profile").replaceChildren(loading)
          fetch(`${torch.domain}/api/v1/profile/${data.username}?get=vr`).then(async video => {
            var profile = await video.json()
            if (profile.success && profile.vr.av) {
              var voice = document.createElement("video")
              voice.style.minWidth = "40vw"
              voice.style.maxWidth = 420
              voice.style.maxHeight = 286
              voice.controls = true
              var source = document.createElement("source")
              source.src = profile.vr.av
              source.onerror = x => {
                x.currentTarget.parentNode.outerHTML = "VR was deleted."
              }
              voice.appendChild(source)
              document.querySelector(".external-modal-profile").replaceChildren(voice)
            } else if (profile.message) {
              var text = document.createTextNode(profile.message)
              document.querySelector(".external-modal-profile").replaceChildren(text)
            } else {
              var text = document.createTextNode("No VR found.")
              document.querySelector(".external-modal-profile").replaceChildren(text)
            }
          }).catch(error => {
            console.log(error)
            var text = document.createTextNode("an ewwow occuwwed ;w;")
            document.querySelector(".external-modal-profile").replaceChildren(text)
          })
          document.querySelector(".external-modal-profile").classList.remove("display-none")
          break;
        case "purchase":
          document.querySelector(".external-modal").showModal()
          document.querySelector(".external-modal").setAttribute("data-external", "purchase")
          document.querySelector(".external-modal-purchase").classList.remove("display-none")
          break;
        default: // TODO: something
          //if (!this.cache.whitelist.includes(host) && this.settings.safety.media.warn_redirect) {
          if (host != "chatango.com" && !this.settings.safety.whitelist.domain.includes(domain.host) && this.settings.safety.media.warn_redirect) {
            document.querySelector(".external-modal").showModal()
            document.querySelector(".external-modal-header").textContent = "A new tab will be opened"
            document.querySelector(".external-modal-description").textContent = "This link takes you outside of Chatango"
            document.querySelector(".external-modal-button").href = domain.href
            document.querySelector(".external-modal-link").textContent = domain.href
            document.querySelector(".external-modal-domain").textContent = `Trust ${domain.host}`
            document.querySelector(".external-modal-warn").classList.remove("display-none")
            document.querySelector(".external-modal-button").onclick = () => {
              var whitelist = document.querySelector(".external-modal-domain").previousElementSibling.checked
              if (whitelist && !client.settings.safety.whitelist.domain.includes(domain.host)) {
                client.settings.safety.whitelist.domain.push(domain.host)
              }
              document.querySelector(".external-modal-domain").previousElementSibling.checked = false
              client.externalWarning({close: true})
            }
          } else {
            open(data.url)
          }
      }
    } else {
      document.querySelector(".external-modal").close()
      document.querySelector(".external-modal").removeAttribute("data-external")
      client.setContext(document.querySelector(".external-modal"), {action: [], level: true})
      if (data.type == "image") {
        document.querySelector(".external-image-wrapper").replaceChildren()
        document.querySelector(".external-modal-media").classList.add("display-none")
      } else if (data.type == "profile") {
        document.querySelector(".external-modal-profile").replaceChildren()
        document.querySelector(".external-modal-profile").classList.add("display-none")
      } else if (data.type == "avatar") {
        document.querySelector(".external-modal-avatar").classList.add("display-none")
      } else if (data.type == "purchase") {
        document.querySelector(".external-modal-purchase").classList.add("display-none")
      } else {
        if (data.overwrite) {
          document.querySelector(".external-modal-button").href = "#"
        }
        document.querySelector(".external-modal-link").textContent = ""
        document.querySelector(".external-modal-warn").classList.add("display-none")
        document.querySelector(".external-modal-domain").textContent = ""
      }
    }
  }

  loadMedia(data) {
    if (!this.cache.media.load && !this.cache.media.exhaust) {
      this.cache.media.load = true
      var index = 0
      var gallery = {}
      var start = this.database.media.transaction(["media"], "readonly").objectStore("media").index("url")
      var range = IDBKeyRange.lowerBound(data.key, true)
      var cursor = start.openCursor(range, "next")
      cursor.onsuccess = x => {
        var storage = x.target.result
        if (storage) {
          index++
          gallery[storage.value.url] = storage.value.name
          if (data.amount || 21 > index) {
            storage.continue()
          } else {
            this.cache.media.load = false
            this.renderMedia({id: "mediaFavorite", index: "media", node: true, source: gallery, edit: true, skip: true})
          }
        } else {
          this.cache.media.load = false
          this.cache.media.exhaust = true
          this.renderMedia({id: "mediaFavorite", index: "media", node: true, source: gallery, edit: true, skip: true})
        }
      }
      cursor.onerror = () => {
        console.log("no perms for media db idk")
      }
    }
  }

  favoriteMedia(url, data) {
    var start = this.database.media.transaction(["media"], "readwrite")
    start.objectStore("media").put({
      url: url,
      name: data || url.split("/").slice(-1)[0]
    })
    start.oncomplete = x => {
      document.querySelectorAll(`[src="${url}"] + .fa-star`).forEach(y => {
        y.setAttribute("data-favorite", true)
        y.classList.remove("fa-regular")
        y.classList.add("fa-solid")
      })
      document.querySelectorAll(`[href="${url}"]`).forEach(y => {
        var previous = y.previousElementSibling
        if (previous) {
          previous.setAttribute("data-favorite", true)
          previous.classList.remove("fa-regular")
          previous.classList.add("fa-solid")
        }
      })
      this.cache.media.exhaust = false
      this.viewMedia()
    }
  }

  unfavoriteMedia(url) {
    var start = this.database.media.transaction(["media"], "readwrite")
    start.objectStore("media").delete(url)
    start.oncomplete = x => {
      document.querySelectorAll(`[src="${url}"] + .fa-star`).forEach(y => {
        y.removeAttribute("data-favorite")
        y.classList.add("fa-regular")
        y.classList.remove("fa-solid")
      })
      document.querySelectorAll(`[href="${url}"]`).forEach(y => {
        var previous = y.previousElementSibling
        if (previous) {
          previous.removeAttribute("data-favorite")
          previous.classList.add("fa-regular")
          previous.classList.remove("fa-solid")
        }
      })
    }
  }

  viewMedia(path, sort) {
    this.cache.media.load = true
    var index = 0
    var cursor = this.database.media.transaction(["media"], "readonly").objectStore("media").index(path || "url").openCursor(null, sort || "next")
    var gallery = {}
    cursor.onsuccess = y => {
      var storage = y.target.result
      if (storage) {
        index++
        gallery[storage.value.url] = storage.value.name
        if (21 > index) {
          storage.continue()
        } else {
          this.cache.media.load = false
          this.renderMedia({id: "mediaFavorite", index: "media", empty: "No media found.", source: gallery, edit: true, skip: true})
        }
      } else {
        console.log("no more")
        this.cache.media.load = false
        this.cache.media.exhaust = true
        this.renderMedia({id: "mediaFavorite", index: "media", empty: "No media found.", source: gallery, edit: true, skip: true})
      }
    }
    cursor.onerror = () => {
      this.cache.media.load = false
    }
  }

  checkMedia(data) {
    return new Promise((resolve, reject) => {
      var cursor = this.database.media.transaction(["media"], "readonly").objectStore("media").index("url").openCursor(data)
      cursor.onsuccess = x => {
        var storage = x.target.result
        if (storage) {
          resolve(true)
        } else {
          resolve(false)
        }
      }
      cursor.onerror = () => {
        reject(false)
      }
    })
  }

  searchMedia(data, auto) {
    return new Promise(async (resolve, reject) => {
      if (!this.cache.wait.media.search) {
        this.cache.wait.media.search = true
        var index = 0
        var gallery = {}
        var cursor = this.database.media.transaction(["media"], "readonly").objectStore("media").index("name").openCursor()
        cursor.onsuccess = x => {
          var storage = x.target.result
          if (storage) {
            var content = storage.value.name
            if (content.includes(data)) {
              index++
              gallery[storage.value.url] = content
            }
            if ((auto ? 3: 20) > index) {
              storage.continue()
            } else {
              this.cache.wait.media.search = false
              if (!auto) {
               this.renderMedia({id: "mediaFavorite", index: "media", empty: "No media found.", source: gallery, edit: true, skip: true})
              }
              resolve(gallery)
            }
          } else {
            this.cache.wait.media.search = false
            if (!auto) {
              this.renderMedia({id: "mediaFavorite", index: "media", empty: "No media found.", source: gallery, edit: true, skip: true})
            }
            resolve(gallery)
          }
        }
        cursor.onerror = x => {
          console.log("media db search err")
          console.log(x)
          reject(x)
        }
      }
    })
  }

  exportMedia() {
    var start = this.database.media.transaction(["media"], "readonly").objectStore("media").getAll()
    start.onsuccess = x => {
      var storage = JSON.stringify(x.target.result)
      var blob = new Blob([storage], {type: "text/json"})
      var link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${this.user.name}_media.json`
      link.dataset.downloadurl = ["text/json", link.download, link.href].join(":")
      link.click()
      link.remove()
    }
  }

  importMedia(data) {
    var start = data.currentTarget.files
    var read = new FileReader()
    read.readAsText(start[0], "utf-8")
    read.onload = x => {
      var source = JSON.parse(x.currentTarget.result)
      var media = this.database.media.transaction(["media"], "readwrite")
      source.forEach(y => {
        media.objectStore("media").put({
          url: y.url,
          name: y.name
        })
      })
      media.oncomplete = y => {
        this.cache.media.exhaust = false
        this.viewMedia()
      }
      media.onerror = y => {
        console.log(y)
        console.log("import media error ;w;")
      }
    }
    data.currentTarget.value = ""
  }

  firstFrame(data) {
    var mimic = document.createElement("canvas")
    mimic.onmouseover = () => {
      mimic.replaceWith(data)
    }
    data.onmouseout = () => {
      data.replaceWith(mimic)
    }
    mimic.width = data.width
    mimic.height = data.height
    mimic.getContext("2d").drawImage(data, 0, 0, mimic.width, mimic.height)
    try {
      data.src = mimic.toDataURL("image/gif")
    } catch(error) {
      for (var x = 0, y; y = data.attributes[x]; x++) {
        mimic.setAttribute(y.name, y.value)
      }
      data.replaceWith(mimic)
    }
  }
}

class Private {
  constructor(data, socket) {
    this.init = true
    this.ready = false
    this.group = "private_message"
    this.user = data.user.name
    this.load = false
    this.premium = {}
    this.input = {}
    this.meet = {
      payload: {},
      load: 0
    }
    this.exhaust = false
    this.character = 9000
    this.socket = socket
    this.friends = []
    this.blocked = []
    this.focus = false
    this.ping = setInterval(async x => {
      this.socket.send("\r\n\x00")
    }, 90000)
  }

  initiate() {
    chatango.renderMini(document.querySelector(".application-private"), {username: client.user.name, clean: true}).then(profile => {
      client.focus = this.group
      client.private.focus = false
      document.querySelector(".application-private").classList.remove("display-none")
      document.querySelector('[data-sidebar="private"]').classList.remove("sidebar-group-error")
      var select = document.querySelector(".sidebar-group-select")
      if (select) {
        select.classList.remove("sidebar-group-select")
      }
      document.querySelector('[data-sidebar="private"]').classList.add("sidebar-group-select")
      document.querySelector(".chat-meta-cancel").click()
      document.querySelector(".application-chat-wrapper").replaceChildren()
      document.querySelector(".application-chat-meet").replaceChildren(document.querySelector(".application-chat-meet").firstElementChild)
      client.renderMessage({content: "Private messages", banner: true, unique: "begin", position: "afterbegin"})
      client.systemMessage({content: "Start a conversation or view your recent messages."})
      client.private.setImport()
      document.querySelector(".server-title").textContent = "Private messages"
      document.querySelector(".server-description").textContent = "Stay safe!"
      if (document.querySelector(".application-chat-meet").classList.contains("display-none")) {
        document.querySelector('[data-toolbar="settings"] span').className = "toolbar-icon fa-solid fa-user-magnifying-glass"
      } else {
        document.querySelector('[data-toolbar="settings"] span').className = "toolbar-icon fa-solid fa-user-xmark"
      }
      if (client.private.pmr) {
        client.systemMessage(client.private.pmr)
      }
      var amount = document.querySelector('[data-sidebar="private"]').getAttribute("data-amount")
      if (amount) {
        document.querySelector('[data-sidebar="private"]').classList.remove("application-icon-mention")
        document.querySelector('[data-sidebar="private"]').setAttribute("data-amount", 0)
        sidebar.changeTab("recent")
      } else {
        sidebar.changeTab("friends")
      }
      client.setConnect({icon: "spinner", content: "Connecting..."})
      client.setPlaceholder({enable: "false", content: "Private messages", clear: true})
    })
  }

  setFocus(data) {
    var target = data.username[0].toUpperCase() + data.username.slice(1)
    var status = {
      online: "is online",
      "online app": "is online on the Chatango mobile app",
      app: "is idle on the Chatango mobile app",
      idle: "has been idle for",
      offline: "has been offline for",
      invalid: "no longer exists or is a group chat"
    }
    var active = `<b>${target}</b> `
    var avatar = data.status
    var blocked = this.blocked.indexOf(data.username) >= 0
    var activity = status[data.status].startsWith("has")
    if (blocked) {
      avatar = "blocked"
      if (activity) {
        active += `is blocked and ${status[data.status]} ${client.displayEpoch({time: data.timestamp, response: "0 seconds"})}.`
      } else {
        active += `is blocked but ${status[data.status]}.`
      }
    } else {
      if (activity) {
        active += `${status[data.status]} ${client.displayEpoch({time: data.timestamp, response: "0 seconds"})}.`
      } else {
        active += `${status[data.status]}.`
      }
    }
    var iframe = document.querySelector(".application-content iframe")
    if (iframe) {
      iframe.classList.add("display-none")
    }
    document.querySelector(".application-chat").classList.remove("display-none")
    client.setConnect({enable: true, icon: "spinner", animation: "rotation 1.5s linear infinite", content: "Connecting..."})
    document.querySelector(".application-chat-sidebar").style.removeProperty("display")
    chatango.renderMini(document.querySelector(".application-private"), {username: target, clean: true}).then(profile => {
      client.focus = "private_message"
      this.exhaust = false
      document.querySelector(".application-private").classList.remove("display-none")
      document.querySelector(".server-title").textContent = "Private messages"
      document.querySelector(".server-description").textContent = "Stay safe!"
      if (document.querySelector(".application-chat-meet").classList.contains("display-none")) {
        document.querySelector('[data-toolbar="settings"] span').className = "toolbar-icon fa-solid fa-user-magnifying-glass"
      } else {
        document.querySelector('[data-toolbar="settings"] span').className = "toolbar-icon fa-solid fa-user-xmark"
      }
      var amount = document.querySelector('[data-sidebar="private"]').getAttribute("data-amount")
      if (amount) {
        document.querySelector('[data-sidebar="private"]').classList.remove("application-icon-mention")
        document.querySelector('[data-sidebar="private"]').setAttribute("data-amount", 0)
      }
      document.querySelector(".application-chat-wrapper").replaceChildren()
      var select = document.querySelector(".sidebar-group-select")
      if (select) {
        select.classList.remove("sidebar-group-select")
      }
      document.querySelector('[data-sidebar="private"]').classList.add("sidebar-group-select")
      /*
      navigator.storage.estimate().then(x => {
        console.log(x.quota) // maximum storage space
        console.log(x.usage) // current storage space
        console.log(((x.usage / x.quota) * 100).toFixed(2)) // percentage of storage space
      })
      */
      var index = 0
      var cursor = client.database.pm.transaction(["messages"], "readonly").objectStore("messages").index("target_idx").openCursor(IDBKeyRange.only(data.username), "prev")
      cursor.onsuccess = y => {
        var storage = y.target.result
        var ts = document.querySelector(`[data-people="recent"] [data-target="${data.username}"][data-timestamp]`)
        if (!ts) sidebar.renderPerson({username: data.username, role: "read", status: data.status, timestamp: data.timestamp, lastmsg: (storage && storage.value.ts) || 0, private: true, unique: true, first: true})
        var lastMsg = document.querySelector(`[data-people="recent"] [data-target="${data.username}"][data-lastmsg]`)
        if (lastMsg) sidebar.renderPerson({username: data.username, role: "read", status: data.status, timestamp: data.timestamp, lastmsg: lastMsg.getAttribute("data-lastmsg"), private: true, unique: true, first: true})
        if (storage) {
          index++
          var before = storage.value.data.split(":").slice(1)
          var key = before[0] == this.user || before[5].match(/<i([a-z0-9]{7,8})\/>/) ? "pm": `${before[3]}=`.replace(".", "_")
          var flags = []
          for (let z in chatango.flags.message) {
            var find = z & parseInt(before[4])
            if (find) {
              flags.push(chatango.flags.message[z])
            }
          }
          client.renderMessage({username: before[0], group: this.group, timestamp: before[3], content: before.slice(5).join(":"), session: before[3], key: key, flag: flags, position: "afterbegin"})
          if (storage.value.unread) {
            client.renderMessage({content: "New messages", banner: true, unique: "new", position: "afterbegin"})
            this.markRead({username: storage.value.target, key: key})
          }
          if (50 > index) {
            storage.continue()
          }
        } else {
          this.exhaust = data.username
          var timestamp = data.status == "offline" ? data.timestamp: Date.now() / 1000
          client.systemMessage({content: active, timestamp: timestamp, avatar: avatar, unique: "status"})
          if (data.blocked) client.systemMessage({content: "This user has blocked you.", timestamp: Date.now() / 1000, avatar: "blocked", unique: "block"})
          var key = document.querySelector(".application-chat-wrapper").querySelectorAll(`[data-user="${data.username}"]`)
          var last = +Array.from(key).slice(-1)[0]
          if (last) {
            this.markRead({username: data.username, key: last.getAttribute("data-timestamp")})
          }
          client.renderMessage({content: `This is the beginning of your conversation with ${target}`, banner: true, unique: "begin", position: "afterbegin"})
        }
      }
      this.focus = data.username
      client.setConnect({icon: "spinner", content: "Connecting..."})
      client.setPlaceholder({enable: torch.crossBrowser, content: `Message to ${target}`, focus: true})
      if (client.settings.appearance.messages.preview_message) {
        client.setInput({enable: true, content: `Type here to message to ${target}`, focus: true})
      }
      document.querySelector(".application-chat-box").onscroll = x => {
        var height = (document.querySelector(".application-chat-box").scrollHeight - document.querySelector(".application-chat-box").clientHeight)
        var top = height - -document.querySelector(".application-chat-box").scrollTop
        if (!this.load && [0, 1].indexOf(top) >= 0) {
          var session = x.currentTarget.querySelector("[data-session]")
          if (session) {
            var key = session.getAttribute("data-session")
            this.loadMessage({username: this.focus, key: parseFloat(key)})
          }
        }
      }
    }).catch(error => {
      console.log(error)
      console.log(`Failed to fetch profile for ${data.username}.`)
      client.setConnect({icon: "spinner", content: "Connecting..."})
    })
  }

  setImport() {
    var upload = document.createElement("input")
    upload.type = "file"
    upload.accept = ".json"
    upload.className = "display-none"
    upload.setAttribute("data-upload", "importMessages")
    upload.onchange = x => {
      this.importMessages(x)
      x.currentTarget.value = ""
    }
    document.querySelector(".application-chat-wrapper").appendChild(upload)
    var wrapper = document.createElement("div")
    wrapper.className = "window-inside-button display-flex margin-horizontal-ten"
    var buttons = {apply: "Import messages", reset: "Export messages"}
    for (let x in buttons) {
      var button = document.createElement("button")
      button.className = `filter-button filter-${x}`
      button.textContent = buttons[x]
      if (x == "apply") {
        button.onclick = () => {
          document.querySelector('[data-upload="importMessages"]').click()
        }
      } else {
        button.onclick = () => {
          this.exportMessages()
        }
      }
      wrapper.appendChild(button)
    }
    document.querySelector(".application-chat-wrapper").appendChild(wrapper)
  }

  renderInbox(node) {
    document.querySelector('[data-index="inbox"]').prepend(node)
  }

  saveMessage(data, target, unread) {
    console.log(data)
    var start = client.database.pm.transaction(["messages"], "readwrite").objectStore("messages").add({
      target: target,
      ts: parseFloat(data[3]),
      data: ["msg"].concat(data).join(":"),
      unread: unread ? 1: 0
    })
    start.onsuccess = x => {
      console.log("save message success owo")
      var flags = []
      for (let x in chatango.flags.message) {
        var find = x & parseInt(data[4])
        if (find) {
          flags.push(chatango.flags.message[x])
        }
       }
      var key = `${data[3]}=`.replace(".", "_")
      var message = client.renderMessage({username: data[0], group: this.group, timestamp: data[3], content: data.slice(5).join(":"), key: key, flag: flags, action: [], node: true})
      this.renderInbox(message)
      var ts = document.querySelector(`[data-people="recent"] [data-target="${target}"][data-timestamp]`)
      if (ts) ts.setAttribute("data-lastmsg", data[3])
    }
    start.onerror = x => {
      console.log(x)
      console.log("save message error ;w;")
      if (x.target.error.name == "ConstraintError") {
        console.log("SAME MSG TS, ATTEMPTING TO ASCEND")
        data[3] = (parseFloat(data[3]) + 1).toString()
        this.saveMessage(data, target, unread)
      }
    }
  }

  removeMessage(data) {
    var start = client.database.pm.transaction(["messages"], "readwrite").objectStore("messages").delete(data)
    start.onsuccess = x => {
      var storage = x.target.result
      console.log(storage)
      if (storage) {
        console.log("message removed from client")
      } else {
        console.log("idk what this implies")
      }
    }
    start.onerror = x => {
      console.log("no permission to delete from db i think")
    }
  }

  searchMessage(target, data) {
    if (!this.load) {
      this.load = true
      var index = 0
      var cursor = client.database.pm.transaction(["messages"], "readonly").objectStore("messages").index("target_idx").openCursor(IDBKeyRange.only(target), "prev")
      cursor.onsuccess = x => {
        var storage = x.target.result
        if (storage) {
          var before = storage.value.data.split(":").slice(1)
          var content = before.slice(5).join(":").replace(/<.*?>/g, "")
          if (content.includes(data)) {
            index++
            console.log(storage.value)
          }
          if (20 > index) {
            storage.continue()
          } else {
            this.load = false
          }
        } else {
          this.load = false
          //client.renderMessage({content: "No more messages found", banner: true, unique: "begin", position: "afterbegin"})
        }
      }
    }
  }

  loadMessage(data) {
    if (!this.load && this.exhaust != data.username) {
      this.load = true
      var index = 0
      var start = client.database.pm.transaction(["messages"], "readonly").objectStore("messages").index("target_ts_idx")
      var range = IDBKeyRange.bound([data.username, 0], [data.username, data.key], false, true)
      var cursor = start.openCursor(range, "prev")
      cursor.onsuccess = x => {
        var storage = x.target.result
        if (storage) {
          if (!index) {
            client.renderMessage({content: "Previous messages above", banner: true, unique: "previous", position: "afterbegin"})
          }
          index++
          var before = storage.value.data.split(":").slice(1)
          var key = before[0] == this.user || before[5].match(/<i([a-z0-9]{7,8})\/>/) ? "pm": `${before[3]}=`.replace(".", "_")
          client.renderMessage({username: before[0], group: this.group, timestamp: before[3], content: before.slice(5).join(":"), session: before[3], key: key, flag: [], position: "afterbegin"})
          if (data.amount || 20 > index) {
            storage.continue()
          } else {
            this.load = false
          }
        } else {
          this.load = false
          this.exhaust = data.username
          var user = data.username[0].toUpperCase() + data.username.slice(1)
          client.renderMessage({content: `This is the beginning of your conversation with ${user}`, banner: true, unique: "begin", position: "afterbegin"})
        }
      }
      cursor.onerror = () => {
        console.log("no perms for db probably")
      }
    }
  }

  exportMessages() {
    var start = client.database.pm.transaction(["messages"], "readonly").objectStore("messages").getAll()
    start.onsuccess = x => {
      var storage = JSON.stringify(x.target.result)
      var blob = new Blob([storage], {type: "text/json"})
      var link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${this.user}_history.json`
      link.dataset.downloadurl = ["text/json", link.download, link.href].join(":")
      link.click()
      link.remove()
    }
  }

  importMessages(data) {
    var start = data.currentTarget.files
    var read = new FileReader()
    read.readAsText(start[0], "utf-8")
    read.onload = x => {
      var source = JSON.parse(x.currentTarget.result)
      var message = client.database.pm.transaction(["messages"], "readwrite")
      source.forEach(y => {
        message.objectStore("messages").put({
          target: y.target,
          ts: parseFloat(y.ts),
          data: y.data,
          unread: y.unread
        })
      })
      message.oncomplete = y => {
        sidebar.changeTab("recent")
        this.viewRecent()
      }
      message.onerror = y => {
        console.log(y)
        console.log("import message error ;w;")
      }
    }
  }

  viewRecent() {
    var start = client.database.pm.transaction(["messages"], "readonly").objectStore("messages").index("target_read_idx").getAll()
    start.onsuccess = x => {
      var storage = x.target.result
      if (storage) {
        var message = {}
        var last_msg = {}
        storage.forEach(y => {
          if (!client.private.blocked.includes(y.target)) {
            last_msg[y.target] = y.ts
            if (y.target in message) {
              if (!message[y.target] && y.unread) {
                message[y.target] = y.unread
              }
            } else {
              message[y.target] = y.unread
            }
          }
        })
        for (let y in message) {
          sidebar.renderPerson({username: y, role: message[y] ? "unread": "read", lastmsg: last_msg[y] || 0, private: true, unique: true, first: true})
        }
      } else {
        console.log("all msgs read")
      }
    }
  }

  markUnread(data) {
    var index = 0
    var start = client.database.pm.transaction(["messages"], "readwrite").objectStore("messages").index("target_ts_idx")
    var range = IDBKeyRange.bound([data.username, 0], [data.username, data.key])
    var cursor = start.openCursor(range, "prev")
    cursor.onsuccess = x => {
      var storage = x.target.result
      if (storage) {
        var value = storage.value
        value.unread = 1
        var mark = storage.update(value)
        mark.onsuccess = () => {
          storage.continue()
        }
        mark.onerror = y => {
          console.error(y)
          console.log("cant mark as read")
          storage.continue()
        }
      }
      cursor.onerror = () => {
        console.log("no perms for db maybe")
      }
    }
  }

  markRead(data) { // marks all messages before data.key as read
    var index = 0
    var start = client.database.pm
.transaction(["messages"], "readwrite").objectStore("messages").index("target_ts_idx")
    var range = IDBKeyRange.bound([data.username, 1], [data.username, data.key])
    var cursor = start.openCursor(range, "prev")
    
    cursor.onsuccess = x => {
      var storage = x.target.result
      if (storage) {
        var value = storage.value
        value.unread = 0
        var mark = storage.update(value)
        mark.onsuccess = () => {
          storage.continue()
        }
        mark.onerror = y => {
          console.error(y)
          console.log("cant mark as unread")
          storage.continue()
        }
      }
      cursor.onerror = () => {
        console.log("no perms for db probably")
      }
    }
  }

  clearHistory(target) {
    var start = client.database.pm.transaction(["messages"], "readwrite").objectStore("messages").index("target_idx")
    var range = IDBKeyRange.only(target)
    var cursor = start.openCursor(range)
    cursor.onsuccess = x => {
      var storage = x.target.result
      if (storage) {
        storage.delete()
        storage.continue()
      }
    }
    cursor.onerror = () => {
      console.log("no db access ig ;w;")
    }
  }

  meetPeople(data) {
    if (this.meet.wait) {
      return
    }
    if (!data.more) {
      document.querySelector(".application-chat-meet").replaceChildren(document.querySelector(".application-chat-meet").firstElementChild)
    }
    if (data.icon && data.text) {
      var meet = document.createElement("div")
      meet.className = "sidebar-people-empty"
      var icon = document.createElement("span")
      icon.className = `application-connect-icon fa-solid fa-${data.icon}`
      if (data.color) {
        icon.style.color = data.color
      }
      var text = document.createElement("span")
      text.className = "application-connect-text"
      text.textContent = data.text
      meet.append(icon, text)
      document.querySelector(".application-chat-meet").appendChild(meet)
    } else {
      if (data.query) {
        this.meet.payload.query = data.query
      }
      if (data.more) {
        this.meet.payload.more = data.more
      } else {
        delete this.meet.payload.more
      }
      if (data.reload) {
        data = this.meet.payload
      } else {
        this.meet.payload = data
      }
      this.meet.wait = true
      if (data.more) {
        if (this.meet.load == -1) {
          console.log("no more members")
          return
        } else {
          this.meet.load = this.meet.load + data.more
          var previous = this.meet.load == 40 ? 0: this.meet.load - data.more
        }
      } else {
        this.meet.load = 40
        var previous = 0
      }
      if (client.private.socket.readyState == client.private.socket.CLOSED) {
        this.meet.load = -1
        this.meetPeople({icon: "power-off", text: "Not connected.", color: "var(--theme-highlight)", more: this.meet.payload.more})
        return
      }
      var loading = document.createElement("span")
      loading.className = "content-loading margin-auto fa-solid fa-spinner"
      document.querySelector(".application-chat-meet").appendChild(loading)
      var form = new FormData()
      //form.append("mode", "inverted")
      //form.append("sr", window["android"]["getS"]())
      form.set("ami", data.age ? data.age.start: 13)
      form.set("ama", data.age ? data.age.end: 99)
      form.set("imc", data.avatar && data.avatar.includes("1") && data.avatar.includes("2") ? 0: data.avatar && data.avatar[0] ? data.avatar[0]: 0)
      form.set("s", data.sex && data.sex.includes("M") && data.sex.includes("F") ? "B": data.sex && data.sex[0] ? data.sex[0]: "N")
      if (data.query) {
        form.set("ss", data.query)
      }
      //form.set("r", 9999)//distance
      //form.set("a2", "Italy")//inCountry && country
      //form.set("la", "latitude")
      //form.set("lo", "longitude")
      //form.set("b", true)// banned
      if (data.online) {
        form.set("o", 1)
      }
      form.set("h5", 1)
      form.set("f", data.more ? previous: 0)
      form.set("t", data.more ? this.meet.load: 40)
      fetch(chatango.path("search"), {
        method: "POST",
        body: form,
        credentials: "include"
      }).then(async response => {
        var data = await response.text()
        this.meet.wait = false
        if (data.startsWith("h=")) {
          var people = data.slice(2).split(":").map(x => x.split(";")[0])
          if (data.more && people.length < this.meet.load) {
            this.meet.load = -1
            document.querySelector(".application-chat-meet").onscroll = null
          } else {
            var meet = document.querySelector(".application-chat-meet")
            document.querySelector(".application-chat-meet").onscroll = () => {
              var bottom = meet.scrollTop == (meet.scrollHeight - meet.offsetHeight)
              if (bottom && !this.meet.wait) {
                meet.scrollTop = (meet.scrollHeight - meet.offsetHeight) - 1
                this.meetPeople({reload: true, more: 15})
              }
            }
          }
          client.socket("private_message", `getpresence:${people.join(";")}`, "Could not load meet people")
        } else {
          this.meet.load = -1
          document.querySelector(".application-chat-meet").onscroll = null
          var loaded = document.querySelector(".application-chat-meet .content-loading")
          if (loaded) {
            loaded.remove()
          }
          switch (data) {
            case "overload": //Chatango is currently overloaded. Meet people is only available to premium members at this time.
              this.meetPeople({icon: "server", text: "Overloaded.", color: "var(--theme-highlight)", more: this.meet.payload.more})
              break;
            case "unsafe": //Chatango mobile app does not allow searching for NSFW content.
              this.meetPeople({icon: "warning", text: "No NSFW.", color: "var(--theme-passive)", more: this.meet.payload.more})
              break;
            case "None":
              this.meetPeople({icon: this.meet.payload.more ? "ban": "question", text: this.meet.payload.more ? "No more members.": "No members found.", color: "var(--brand-chatango)", more: this.meet.payload.more})
              break;
            case "unauthed":
              this.meetPeople({icon: "right-to-bracket", text: "Relogin required.", color: "var(--theme-highlight)", more: this.meet.payload.more})
              break;
          }
        }
      }).catch(error => {
        console.log(error)
        this.meet.wait = false
        this.meetPeople({icon: "warning", text: "An error occurred.", color: "var(--theme-highlight)"})
      })
    }
  }

  hideMeet() {
    document.querySelector('[data-toolbar="settings"] span').className = "toolbar-icon fa-solid fa-user-magnifying-glass"
    document.querySelector(".application-chat-meet").classList.add("display-none")
    document.querySelector(".application-chat-users").classList.remove("display-none")
    document.querySelector(".application-chat-with").classList.remove("display-none")
    document.querySelector(".application-chat-search").classList.add("display-none")
  }

  disconnectFrom() {
    if (this.socket.readyState == this.socket.OPEN) {
      this.socket.close()
    }
    clearInterval(this.ping)
    this.focus = false
    document.querySelector('[data-sidebar="private"]').classList.add("sidebar-group-error")
    document.querySelector('[data-sidebar="private"]').setAttribute("data-amount", "!")
  }
}

class Group {
  constructor(data, socket) {
    this.ready = false
    this.user = data.content
    this.room = data.packet
    this.load = 0
    this.socket = socket
    this.ping = setInterval(async x => {
      this.socket.send("\r\n\x00")
    }, 90000)
  }

  get premium() {
    var status = {
      200: "You purchased Chatango Premium and it",
      210: "You were gifted Chatango Premium and it",
      101: "Your Chatango Premium",
      111: "Your gift of Chatango Premium"
    }
    var purchase = this.user.premium.status
    var timestamp = this.user.premium.timestamp
    if (+timestamp > (Date.now() / 1000)) {
      return `${status[purchase]} ${client.convertEpoch({time: timestamp, response: "expires on", extra: true})}`
    } else {
      return `${status[purchase]} ${client.convertEpoch({time: timestamp, response: "expired on", yesterday: "expired yesterday at", extra: true})}`
    }
  }

  updateAnnouncement(data) {
    document.querySelector('[data-option-button="announcement"]').querySelector('[data-button="save"]').onclick = () => {
      var announce = document.querySelector('[data-content="announcement"]')
      var save = {
        bold: announce.querySelector(".fa-bold").previousElementSibling.checked,
        italic: announce.querySelector(".fa-italic").previousElementSibling.checked,
        underline: announce.querySelector(".fa-underline").previousElementSibling.checked,
        face: announce.querySelector(".annc-font-face").firstElementChild.value,
        size: announce.querySelector(".annc-font-size .text-input").value.padStart(2, "0"),
        name: announce.querySelector('[data-color="annc-font-name"]').value.slice(1),
        color: announce.querySelector('[data-color="annc-font-color"]').value.slice(1),
        enable: +announce.querySelector('[data-setting="enable"]').firstElementChild.checked,
        interval: announce.querySelector('[data-setting="interval"]').firstElementChild.value * 60
      }
      var background = +announce.querySelector('[data-setting="background"]').firstElementChild.checked
      if (save.enable && background) {
        save.enable += background + 1
      }
      var content = ""
      var encode = document.createElement("div")
      encode.textContent = announce.querySelector('[data-setting="content"]').value
      if (save.bold) {content += "<b>"}
      if (save.italic) {content += "<i>"}
      if (save.underline) {content += "<u>"}
      content += encode.innerHTML.replaceAll("  ", " &nbsp;").replaceAll("\n", "\r")
      if (save.underline) {content += "</u>"}
      if (save.italic) {content += "</i>"}
      if (save.bold) {content += "</b>"}
      this.socket.send(`updateannouncement:${save.enable}:${save.interval}:<n${save.name}/><f x${save.size}${save.color}="${save.face}">${content}\r\n`)
      this.updateAnnouncement({enable: Boolean(save.enable), background: save.enable == 3, interval: save.interval / 60, content: encode.textContent})
      setTimeout(() => {
        this.socket.send("getannouncement\r\n")
      }, 1000)
    }
    var announce = document.querySelector('[data-option="overview"]').querySelector('[data-content="announcement"]')
    announce.querySelectorAll("[data-setting]").forEach(x => {
      let item = x.getAttribute("data-setting")
      if (item in data) {
        if (item == "style") {
          Object.keys(data[item]).forEach(y => {
            if (["bold", "italic", "underline"].indexOf(y) >= 0) {
              if (data[item][y]) {
                x.querySelector(`.fa-${y}`).previousElementSibling.checked = true
              } else {
                x.querySelector(`.fa-${y}`).previousElementSibling.checked = false
              }
            } else {
              if (data[item][y]) {
                var select = x.querySelector(`.annc-font-${y}`)
                var color = x.querySelector(`[data-color-input="annc-font-${y}"]`)
                if (select) {
                  select.firstElementChild.value = data[item][y][1].replaceAll("\r", "\n")
                } else if (color) {
                  x.querySelector(`[data-color="annc-font-${y}"]`).value = "#" + hexExtend(data[item][y][1])
                  color.value = "#" + hexExtend(data[item][y][1])
                  color.style.color = "#" + hexExtend(data[item][y][1])
                }
              }
            }
          })
        } else {
          var element = x.firstElementChild ? x.firstElementChild: x
          if (element.getAttribute("type") == "checkbox") {
            element.checked = data[item]
          } else {
            element.value = data[item]
          }
        }
      }
    })
  }

  updateInformation(data) {
    var capital = this.room.name[0].toUpperCase() + this.room.name.slice(1)
    if (client.focus == this.room.name) {
      document.querySelector(".server-name").value = this.room.name
    }
    if (data.title) {
      var title = data.decode ? decodeURIComponent(data.title): data.title
      if (title.trim().length > 0) {
        this.room.information.title = title
        if (client.focus == this.room.name) {
          document.querySelector(".server-title").textContent = title
          document.querySelector(".edit-server-title").value = title
          var preload = document.querySelector('[data-window="information"]')
          if (preload) {
            preload.querySelector(".chat-window-title").textContent = title
          }
        }
      } else {
        this.room.information.title = capital
        if (client.focus == this.room.name) {
          document.querySelector(".server-title").textContent = capital
          document.querySelector(".edit-server-title").value = ""
          document.querySelector(".edit-server-title").setAttribute("placeholder", capital)
          var preload = document.querySelector('[data-window="information"]')
          if (preload) {
            preload.querySelector(".chat-window-title").textContent = capital
          }
        }
      }
    } else {
      this.room.information.title = capital
      if (client.focus == this.room.name) {
        document.querySelector(".server-title").textContent = capital
        document.querySelector(".edit-server-title").value = ""
        document.querySelector(".edit-server-title").setAttribute("placeholder", capital)
        var preload = document.querySelector('[data-window="information"]')
        if (preload) {
          preload.querySelector(".chat-window-title").textContent = capital
        }
      }
    }
    if (data.description) {
      var description = data.decode ? decodeURIComponent(data.description): data.description
      if (description.trim().length > 0) {
        this.room.information.description = description
        if (client.focus == this.room.name) {
          document.querySelector(".server-description").textContent = description
          document.querySelector(".edit-server-description").value = description
          var preload = document.querySelector('[data-window="information"]')
          if (preload) {
            preload.querySelector('[data-page="Information"]').textContent = description
          }
        }
      } else {
        this.room.information.description = "No description"
        if (client.focus == this.room.name) {
          document.querySelector(".server-description").textContent = "No description"
          document.querySelector(".edit-server-description").value = ""
          document.querySelector(".edit-server-description").setAttribute("placeholder", "No description")
          var preload = document.querySelector('[data-window="information"]')
          if (preload) {
            preload.querySelector('[data-page="Information"]').textContent = "No description"
          }
        }
      }
    } else {
      this.room.information.description = "No description"
      if (client.focus == this.room.name) {
        document.querySelector(".server-description").textContent = "No description"
        document.querySelector(".edit-server-description").value = ""
        document.querySelector(".edit-server-description").setAttribute("placeholder", "No description")
        var preload = document.querySelector('[data-window="information"]')
        if (preload) {
          preload.querySelector('[data-page="Information"]').textContent = "No description"
        }
      }
    }
  }
}

class Font {
  constructor(data) {
    this.bold = data.bold || false
    this.face = data.face || "0"
    this.size = data.size == 9 ? "09": data.size || "11"
    this.name = data.name || "000"
    this.color = data.color || "000"
    this.italic = data.italic || false
    this.underline = data.underline || false
    this.strikethrough = data.strikethrough || false
  }
}

const client = new Client()

const settings = {
  profile: {
    advanced: {
      mode_debug: false,
      mode_developer: false
    }
  },
  safety: {
    media: {
      embed_image: true,
      embed_audio: true,
      embed_video: true,
      proxy_media: true,
      warn_redirect: true
    },
    users: {
      allow_unfriend: true,
      allow_group: true,
      allow_bot: true,
      allow_verified_bot: true,
      format_ignore: 1,
      ignore: []
    },
    groups: {
      warn_unsafe: true,
      warn_unregister: true,
      warn_inactive: true
    },
    messages: {
      show_guest: true,
      censor_unsafe: {
        enable: true,
        behavior: 1,
        blacklist: []
      }
    },
    blocked: {
      sync_group: false,
      censor_blocked: {
        enable: true,
        behavior: 1
      }
    },
    whitelist: {
      enable: true,
      domain: []
    }
  },
  privacy: {
    groups: {
      connect_own: false,
      connect_recent: false,
      connect_favorite: true,
      favorite: []
    },
    private_messages: {
      connect_start: false,
      check_pmr: true,
      show_idle: true,
      check_block: false
    },
    meet_people: {
      show_profile: false,
      censor_unsafe: {
        enable: true,
        behavior: 1
      }
    },
    client: {
      username_title: true,
      data_improve: true,
      data_personal: true,
      data_chatango: true
    }
  },
  notifications: {
    display: {
      tab_title: true,
      mention_recent: true,
      new_message: true,
      new_feature: true,
      new_bubble: true,
      mention_bubble: true,
      new_update: true,
      private_focus: true,
      toast_online: true,
      toast_offline: true,
      push_desktop: false
    },
    sound: {
      play_focus: false,
      play_mention: true,
      volume_mention: 30,
      play_message: false,
      volume_message: 30,
      play_private: true,
      play_online: false,
      volume_online: 30,
      play_offline: false,
      play_desktop: true
    },
    muted: {
      groups: [],
      users: []
    }
  },
  media: {
    content: {
      autoplay_emoji: true,
      autoplay_gif: true,
      autoplay_embed: false
    }
  },
  display: {
    transition_time: 0.1,
    transition_on: true,
    high_contrast: false,
    invert_display: false,
    saturation: 100,
    brightness: 100,
    sepia_mode: 0,
    grayscale: 0
  },
  appearance: {
    sidebar: {
      profile_friend: false,
      profile_recent: false,
      unread_message: false
    },
    messages: {
      preview_message: false,
      adjust_color: true,
      parse_markdown: false,
      format_message: 1,
      align_date: 1,
      opacity_date: 100,
      align_ip: 1,
      opacity_ip: 100,
      font_scale: 100,
      quality_avatar: 4,
      quality_group: 4,
      show_badge: true,
      show_avatar: true,
      show_style: true,
      show_bg: true,
      show_bg_img: true,
      show_annc: true,
      show_bg_annc: true
    }
  }
}

function checkSettings(data, path) {
  Object.entries(data).forEach(x => {
    var settingOption = x[0]
    if (x[1].constructor == Object) {
      checkSettings(x[1], `${path} ${x[0]}`)
      var currentPath = `${path} ${x[0]}`.trim().split(" ")
      if (currentPath[0] && !(currentPath[0] in client.settings)) {
        client.settings[currentPath[0]] = x[1]
      } else if (currentPath[1] && x[1]) {
        if (currentPath[1] && !(currentPath[1] in client.settings[currentPath[0]])) {
          client.settings[currentPath[0]][currentPath[1]] = x[1]
        } else {
          Object.entries(x[1]).forEach(y => {
            if (!(y[0] in client.settings[currentPath[0]][currentPath[1]])) {
              client.settings[currentPath[0]][currentPath[1]][y[0]] = y[1]
            }
          })
        }
      }
    }
  })
}

var userSettings = localStorage.getItem("settings")
if (userSettings) {
  client.settings = JSON.parse(userSettings)
  checkSettings(settings, "")
} else {
  client.settings = settings
  var source = JSON.stringify(client.settings)
  localStorage.setItem("settings", source)
}

document.querySelectorAll("[data-setting]").forEach(x => {
  let item = x.getAttribute("data-setting")
  let directory = x.getAttribute("data-setting-dir")
  if (directory) {
    var first = x.firstElementChild
    var value = directory.split(" ").reduce((y, z) => client.settings[y][z])[item]
    x.value ? x.value = value: first.getAttribute("type") == "checkbox" ? first.checked = value: (first.value = value, first.nextElementSibling.value = value)
    x.onchange = (y) => {
      var value = y.target.getAttribute("type") == "checkbox" ? y.target.checked: y.target.value
      if (x.getAttribute("data-setting-extra") == "none") {
        directory.split(" ").reduce((z, a) => {
          !(a in client.settings[z]) ? client.settings[z][a] = {[item]: value}: client.settings[z][a][item] = value
        })
        if (item == "push_desktop" && value) {
          Notification.requestPermission().then(permission => {
            if (permission == "granted") {
              client.setNotice({enable: true, icon: "check", color: "var(--theme-active)", content: "Desktop push notifications have been enabled."})
            } else {
              client.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: "Desktop push notifications was denied or is unavailable."})
              y.target.checked = false
              client.settings.notifications.display.push_desktop = false
            }
          })
        }
      } else {
        directory.split(" ").reduce((z, a) => client.settings[z][a])[item].enable = value
      }
      var source = JSON.stringify(client.settings)
      localStorage.setItem("settings", source)
    }
  }
})

/*
This is intended for client customization, where users may implement their own functions to these events without editing the main code.
Full documentation for client functions will come later and a way to
add these automatically after every client update will be figured out at some point.
*/

client.on("clientLogin", data => {
  console.log(`Logged in as ${data.detail.user.name}.`)
})

client.on("groupConnect", data => {
  console.log(`Connected to #${data.detail.room.name}.`)
})

client.on("memberLogin", data => {
  console.log(`${data.detail.before} logged in to ${data.detail.after}.`)
})

client.on("memberLogout", data => {
  console.log(`${data.detail.before} has logged out to ${data.detail.after}.`)
})

client.on("memberSwitch", data => {
  console.log(`${data.detail.before} has switched accounts to ${data.detail.after}.`)
})

client.on("memberChange", data => {
  console.log(`${data.detail.before} changed name to ${data.detail.after}.`)
})

client.on("memberJoin", data => {
  console.log(`${data.detail} has joined.`)
})

client.on("memberLeave", data => {
  console.log(`${data.detail} has left.`)
})

client.on("anonJoin", data => {
  console.log(`Anon ${data.detail} has joined.`)
})

client.on("anonLeave", data => {
  console.log(`Anon ${data.detail} has left.`)
})

client.on("anonName", data => {
  console.log(`Anon ${data.detail.before} set name to ${data.detail.after}.`)
})

/* APPLICATION SIDEBAR FUNCTIONS */

class Sidebar {
  constructor(client) {
    this.client = client
    this.resize = {}
    this.tooltip = {
      private: {
        tip: "Private messages",
        arrow: "left",
        top: 14,
        left: 72
      },
      plus: {
        tip: "Group window",
        arrow: "left",
        top: 14,
        left: 72
      },
      user: {
        tip: client.user.full,
        arrow: "left",
        top: 14,
        left: 72
      },
      purchase: {
        tip: "Purchase window",
        arrow: "left",
        top: 14,
        left: 72
      },
      toggle: {
        tip: "Toggle members",
        arrow: "top",
        top: 44,
        left: -48
      },
      mention: {
        tip: "Recent mentions",
        arrow: "top",
        top: 44,
        left: -48
      },
      settings: {
        tip: "Group settings",
        arrow: "top",
        top: 44,
        left: -48
      }
    }
  }

  changeTab(data) {
    var select = document.querySelector(".sidebar-option-select")
    if (select) {
      select.classList.remove("sidebar-option-select")
    }
    document.querySelector(".application-sidebar-option").querySelector(`[data-people="${data}"]`).classList.add("sidebar-option-select")
    document.querySelector(".application-sidebar-people").querySelector(".display-block[data-people]").classList.remove("display-block")
    document.querySelector(".application-sidebar-people").querySelector(`[data-people="${data}"]`).classList.add("display-block")
    document.querySelectorAll(".chat-sidebar-option").forEach(x => {
      var check = x.classList.contains("sidebar-option-select")
      if (!check) {
        var cancel = false
        x.onmouseover = () => {
          cancel = document.querySelector(".sidebar-option-select")
          document.querySelector(".sidebar-option-select").classList.remove("sidebar-option-select")
          x.classList.add("sidebar-option-select")
        }
        x.onfocus = x.onmouseover
        x.onmouseout = () => {
          if (cancel) {
            cancel.classList.add("sidebar-option-select")
          }
          x.classList.remove("sidebar-option-select")
        }
        x.onblur = x.onmouseout
      } else {
        x.onmouseover = null
        x.onfocus = null
        x.onmouseout = null
        x.onblur = null
      }
      x.onclick = y => {
        var target = y.currentTarget.getAttribute("data-people")
        this.changeTab(target)
      }
      x.onkeyup = y => {
        if (y.code == "Space") {
          y.currentTarget.click()
          document.querySelector(".chat-sidebar-option").focus()
        }
      }
    })
  }

  renderTooltip(data) {
    var item = document.querySelector(`[data-sidebar="${data}"]`) || document.querySelector(`[data-toolbar="${data}"]`)
    item.onmouseover = x => {
      var display = document.querySelector(".application-tooltip-item")
      if (!display) {
        var position = x.currentTarget.getBoundingClientRect()
        var tooltip = document.createElement("span")
        tooltip.className = "application-tooltip-item"
        tooltip.textContent = this.tooltip[data].tip
        tooltip.setAttribute("data-tip", this.tooltip[data].arrow)
        tooltip.style.top = position.top + this.tooltip[data].top + "px"
        tooltip.style.left = position.left + this.tooltip[data].left + "px"
        document.body.appendChild(tooltip)
      }
    }
    item.onfocus = item.onmouseover
    item.ontouchstart = item.onmouseover
    item.onmouseout = () => {
      var hover = document.querySelector(".application-tooltip-item")
      if (hover) {
        hover.remove()
      }
    }
    item.onblur = item.onmouseout
    item.ontouchend = item.onmouseout
  }

  renderItem(data) {
    var entity = data.item.toLowerCase()
    var capital = entity[0].toUpperCase() + entity.slice(1)
    var item = document.createElement("div")
    item.className = "group-index-item"
    item.setAttribute("data-group", data.item)
    item.setAttribute("data-group-index", data.index)
    /*
    if (data.hidden) {
      item.classList.add("display-none")
    }
    */
    if (data.icon.startsWith("group")) {
      item.onclick = x => {
        document.querySelector('[data-form="join"]').querySelector('[name="group"]').value = entity
        document.querySelector('[data-form="join"]').querySelector('[type="submit"]').click()
      }
    }
    var avatar = chatango.renderIcon(data.item)
    item.appendChild(avatar)
    var detail = document.createElement("div")
    detail.className = "group-index-detail"
    var index = document.createElement("div")
    index.className = data.select ? "group-index-name group-index-select": "group-index-name"
    index.textContent = data.icon.startsWith("group") ? "#" + entity: capital
    detail.appendChild(index)
    var title = document.createElement("div")
    title.className = "group-index-title"
    title.textContent = data.title
    if (data.color) {
      title.style.color = `var(--${data.color})`
    }
    detail.appendChild(title)
    item.appendChild(detail)
    var more = document.createElement("div")
    more.className = "group-index-more"
    for (let x in data.more) {
      var option = document.createElement("span")
      option.className = `group-more-item ${x}`
      option.onclick = y => {
        y.stopPropagation()
        data.more[x](y)
      }
      more.appendChild(option)
    }
    item.appendChild(more)
    if (data.extra) {
      var extra = document.createElement("div")
      extra.className = "group-index-extra"
      data.extra.forEach(x => {
        var content = document.createElement("span")
        content.className = "group-index-title"
        content.textContent = x
        extra.appendChild(content)
      })
      item.appendChild(extra)
    }
    document.querySelector(`[data-index="${data.index}"]`).insertAdjacentElement(data.position, item)
  }

  renderGroup(data) {
    var exist = document.querySelector(`.sidebar-group-item [data-group="${data.group}"]`)
    if (exist) {
      exist.remove()
    }
    if (data.group != torch.environment) {
      if (!data.hidden) {
        var item = document.createElement("div")
        item.className = "sidebar-group-item"
        item.setAttribute("tabindex", 0)
        item.setAttribute("data-amount", 0)
        item.onclick = x => {
          var target = x.currentTarget.firstElementChild.getAttribute("data-group")
          if (target) {
            var outage = x.currentTarget.classList.contains("sidebar-group-error")
            if (outage) {
              document.querySelector('[data-form="join"]').querySelector('[name="group"]').value = target
              document.querySelector('[data-form="join"]').querySelector('[type="submit"]').click()
            } else {
              client.setFocus({group: target, reload: true})
            }
          }
        }
        item.oncontextmenu = x => {
          x.preventDefault()
          var target = x.currentTarget.firstElementChild.getAttribute("data-group")
          client.setContext(x.currentTarget, {action: ["group_settings", "group_leave"], height: true, top: 0, left: -65, content: {group: target}, toggle: true})
        }
        item.onmouseover = x => {
          var display = document.querySelector(".application-sidebar-content").querySelector(".sidebar-group-name")
          if (!display) {
            var position = x.currentTarget.getBoundingClientRect()
            var server = document.createElement("span")
            server.className = "sidebar-group-name"
            server.textContent = "#" + data.group
            server.style.top = position.top + 14 + "px"
            server.style.left = position.left + 72 + "px"
            document.querySelector(".application-sidebar-content").appendChild(server)
          }
        }
        item.onfocus = item.onmouseover
        item.ontouchstart = item.onmouseover
        item.onmouseout = () => {
          var hover = document.querySelector(".sidebar-group-name")
          if (hover) {
            hover.remove()
          }
        }
        item.onblur = item.onmouseout
        item.ontouchend = item.onmouseout
        var icon = chatango.renderIcon(data.group)
        data.pending ? icon.classList.add("sidebar-group-pending"): null
        icon.setAttribute("data-group", data.group)
        item.appendChild(icon)
        document.querySelector(".application-sidebar-content").prepend(item)
      }

      var unique = document.querySelector(`[data-preload="join"] [data-group="${data.group}"]`)
      var muted = client.settings.notifications.muted.groups.includes(data.group)
      var favorite = client.settings.privacy.groups.favorite.includes(data.group)

      if (!unique) {
        this.renderItem({
          item: data.group,
          index: favorite ? "favorited": data.recent ? "recent": "own",
          icon: "group icon",
          select: data.group == "community",
          title: data.header,
          position: "beforeend",
          hidden: data.hidden,
          more: {
            [muted ? "fa-solid fa-bell-slash": "fa-solid fa-bell"]: y => {
              y.currentTarget.classList.contains("fa-bell") ? y.currentTarget.className = "group-more-item group-more-notify fa-solid fa-bell-slash": y.currentTarget.className = "group-more-item fa-solid fa-bell"
              if (client.settings.notifications.muted.groups.includes(data.group)) {
                client.settings.notifications.muted.groups = client.settings.notifications.muted.groups.filter(x => x != data.group)
              } else {
                client.settings.notifications.muted.groups.push(data.group)
              }
              var source = JSON.stringify(client.settings)
              localStorage.setItem("settings", source)
            },
            [favorite ? "fa-solid fa-star": "fa-regular fa-star"]: y => {
              y.currentTarget.classList.contains("fa-regular") ? y.currentTarget.className = "group-more-item fa-solid fa-star": y.currentTarget.className = "group-more-item fa-regular fa-star"
              var index = y.currentTarget.parentNode.parentNode
              var original = y.currentTarget.parentNode.parentNode
              if (index.parentNode.getAttribute("data-index") == "favorited") {
                client.settings.privacy.groups.favorite.includes(data.group) ? client.settings.privacy.groups.favorite = client.settings.privacy.groups.favorite.filter(x => x != data.group): null
                original.parentNode.parentNode.querySelector(`[data-index="${original.getAttribute("data-group-index")}"]`).appendChild(original)
              } else {
                !client.settings.privacy.groups.favorite.includes(data.group) ? client.settings.privacy.groups.favorite.push(data.group): null
                original.parentNode.parentNode.querySelector('[data-index="favorited"]').appendChild(index)
              }
              var source = JSON.stringify(client.settings)
              localStorage.setItem("settings", source)
              Array.from(["favorited", "recent", "own"]).forEach(y => {
                if (Array.from(original.parentNode.parentNode.querySelector(`[data-index="${y}"]`).children).filter(z => z.style.display != "none").length == 1) {
                  document.querySelector(`[data-empty="group${y[0].toUpperCase() + y.slice(1)}"]`).style.display = "block"
                } else {
                  document.querySelector(`[data-empty="group${y[0].toUpperCase() + y.slice(1)}"]`).removeAttribute("style")
                }
              })
            }
          }
        })
      }
    }
  }

  renderPerson(data) {
    if (data.username) {
      var target = data.username.toLowerCase()
      var avatars = chatango.getAvatar(target)
      var guest = target.startsWith("!") || target.startsWith("#")
      var item = document.createElement("div")
      item.className = "sidebar-user-item"
      item.setAttribute("tabindex", 0)
      item.setAttribute("data-target", data.username)
      if (client.focus != "private_message") {
        if (client.focus in client.groups && data.username == torch.groups[client.focus].uid) {
          item.style.display = "none"
        }
      }
      Array.from(["status", "previous", "timestamp", "lastmsg"]).forEach(x => {
        if (x in data) {
          item.setAttribute(`data-${x}`, data[x])
        }
      })
      item.onclick = () => {
        if (data.private) {
          client.socket("private_message", `connect:${target}`, "An ewwow occuwwed ;w;")
          /*
          var status = item.getAttribute("data-status")
          if (status) {
            client.private.setFocus(data)
          } else {
            client.socket("private_message", `connect:${target}`, "An ewwow occuwwed ;w;")
          }
          */
        } else {
          client.externalWarning({url: chatango.link(target), username: data.username, type: "profile"})
        }
      }
      item.oncontextmenu = x => {
        x.preventDefault()
        var action = guest ? ["mention"]: ["mention", "avatar", "who"]
        if (!guest && client.private) {
          var friend = client.private.friends.includes(target) ? "unfriend": "friend"
          var blocked = client.private.blocked.includes(target) ? "unblock": "block"
          action.push(friend, "message", blocked)
        }
        action.push(client.cache.listen.includes(target) ? "unlisten": "listen")
        action.push(client.settings.safety.users.ignore.includes(target) ? "unignore": "ignore")
        if (data.role && ["read", "unread"].includes(data.role)) action.push("close")
        client.setContext(item, {action: action, content: {username: data.username}, height: true, left: 180, event: x, meta: {guest: guest}, toggle: true})
      }
      item.onmouseenter = () => {
        var valid = item.getAttribute("data-timestamp")
        var lastmsg = item.getAttribute("data-lastmsg")
        var timer = document.querySelector(".sidebar-user-timer")
        var dupe = item.getAttribute("data-dupe")
        var ctx = document.querySelector('[data-people="recent"] .sidebar-sort-item').value
        if (lastmsg && ctx == 5) {
          if (lastmsg == 0) return
          var time = document.createElement("span")
          time.className = "sidebar-user-name sidebar-user-timer text-transform-none"
          time.textContent = client.displayEpoch({time: item.getAttribute("data-lastmsg"), response: "Just now"})
          client.cache.interval.timer = setInterval(() => {
            time.textContent = client.displayEpoch({time: item.getAttribute("data-lastmsg"), response: "Just now"})
          }, 1000)
          item.querySelector(".sidebar-user-target").appendChild(time)
        } else if (valid && valid != 0 && !timer) {
          var time = document.createElement("span")
          time.className = "sidebar-user-name sidebar-user-timer text-transform-none"
          time.textContent = client.displayEpoch({time: item.getAttribute("data-timestamp"), response: "Just now"})
          if (dupe) (time.textContent += ` - (${dupe})`)
          client.cache.interval.timer = setInterval(() => {
            var duped = item.getAttribute("data-dupe")
            time.textContent = client.displayEpoch({time: item.getAttribute("data-timestamp"), response: "Just now"})
            if (duped) (time.textContent += ` - (${duped})`)
          }, 1000)
          item.querySelector(".sidebar-user-target").appendChild(time)
        }
      }
      item.onmouseleave = () => {
        clearInterval(client.cache.interval.timer)
        var timer = document.querySelector(".sidebar-user-timer")
        if (timer) {
          timer.remove()
        }
      }
      var quality = parseInt(client.settings.appearance.messages.quality_avatar)
      var avatar = document.createElement("img")
      avatar.className = "sidebar-user-avatar"
      avatar.src = target == "client" ? `${torch.static}/img/client.png`: guest ? `${torch.static}/img/noimage.jpg`: [1, 2].includes(quality) ? avatars.images[1]: avatars.images[2]
      avatar.alt = `${data.username} profile picture`
      avatar.loading = "lazy"
      if ([2, 4].includes(quality)) {
        avatar.style.imageRendering = "pixelated"
      }
      if (data.status) {
        var picture = document.createElement("div")
        picture.className = "sidebar-user-picture"
        picture.appendChild(avatar)
        var activity = document.createElement("span")
        activity.className = "sidebar-user-status fa-solid"
        picture.appendChild(activity)
        item.appendChild(picture)
      } else {
        item.appendChild(avatar)
      }
      var member = document.createElement("div")
      member.className = "sidebar-user-target"
      var user = document.createElement("span")
      user.className = data.sensitive ? "sidebar-user-name text-transform-none": "sidebar-user-name"
      user.textContent = guest ? data.username.slice(1): data.username
      member.appendChild(user)
      item.appendChild(member)
      var select = document.querySelector(`[data-role="${data.role}"]`)
      if (data.unique) {
        var present = select.parentNode.parentNode.querySelector(`[data-target="${data.username}" i]`)
        if (present) {
          var previous = present.getAttribute("data-status")
          if (data.status && previous) {
            if (data.status == "online" && previous == "app") {
              data.status = "online app"
              item.setAttribute("data-status", "online app")
            }
          }
          present.remove()
        }
      }
      var parent = select.parentNode.parentNode.getAttribute("data-people")
      var render = data.sidebar || (parent == "friends" && client.settings.appearance.sidebar.profile_friend) || (parent == "recent" && client.settings.appearance.sidebar.profile_recent)
      if (render) {
        data.sidebar = true
        chatango.renderMini(select, data).then(profile => {
          var apply = select.querySelectorAll(`[data-target="${data.username}"]`)
          var reduce = Array.from(apply)
          reduce.slice(1).forEach(x => {
            x.remove()
          })
          reduce[0].replaceWith(profile)
        })
      } else {
        data.first ? select.prepend(item): select.appendChild(item)
      }
    }
  }

  renderRole(data) {
    var lower = data.name.toLowerCase()
    var item = document.createElement("div")
    item.className = "sidebar-people-item"
    if (data.permission) {
      item.setAttribute("data-user-permission", data.permission)
    }
    if (data.color) {
      item.style.color = data.color
    }
    var header = document.createElement("div")
    header.className = "sidebar-role-header"
    var icon = document.createElement("span")
    icon.className = `sidebar-role-icon fa-solid fa-${data.icon}`
    header.appendChild(icon)
    var title = document.createElement("span")
    title.className = "sidebar-role-name"
    title.textContent = data.name
    header.appendChild(title)
    var count = document.createElement("span")
    count.className = data.collapse ? "sidebar-role-count display-block": "sidebar-role-count"
    count.setAttribute("data-count", 0)
    header.appendChild(count)
    var collapse = document.createElement("span")
    collapse.className = `sidebar-role-collapse fa-solid ${data.collapse ? "fa-chevron-up": "fa-chevron-down"}`
    collapse.setAttribute("tabindex", 0)
    collapse.onclick = x => {
      var collapsed = x.currentTarget.classList.contains("fa-chevron-down")
      x.currentTarget.className = collapsed ? "sidebar-role-collapse fa-solid fa-chevron-up": "sidebar-role-collapse fa-solid fa-chevron-down"
      x.currentTarget.parentNode.parentNode.querySelector(".sidebar-people-wrapper").classList.toggle("display-none")
      x.currentTarget.previousElementSibling.classList.toggle("display-block")
    }
    collapse.onkeyup = x => {
      if (x.code == "Space") {
        x.currentTarget.click()
      }
    }
    header.appendChild(collapse)
    item.appendChild(header)
    var wrapper = document.createElement("div")
    wrapper.className = data.collapse ? "sidebar-people-wrapper text-transform-capital display-none": "sidebar-people-wrapper text-transform-capital"
    wrapper.setAttribute("data-role", lower)
    item.appendChild(wrapper)
    document.querySelector(".application-sidebar-people").querySelector(`[data-people="${data.role}"]`).appendChild(item)
  }

  parseParticipant(data) {
    data.forEach(x => {
      var target = x.split(":")
      if (target[3] != "None") {
        var member = target[3].toLowerCase()
        if (member == client.groups[client.focus].room.owner) {
          var owner = document.querySelector('[data-role="owner"]').firstElementChild
          if (owner) {
            owner.setAttribute("data-target", target[3])
            owner.setAttribute("data-timestamp", target[1])
            owner.setAttribute("data-status", "online")
            owner.querySelector(".sidebar-user-name").textContent = target[3]
          }
        } else if (client.cache.bots.verified.indexOf(member) >= 0) {
          this.renderPerson({username: target[3], sensitive: true, role: "bot", timestamp: target[1]})
        } else if (member in client.groups[client.focus].room.moderator) {
          var administrator = client.groups[client.focus].room.moderator[member].some(x => chatango.flags.administrator.includes(x))
          if (administrator) {
            this.renderPerson({username: target[3], sensitive: true, role: "administrator", timestamp: target[1]})
          } else {
            this.renderPerson({username: target[3], sensitive: true, role: "moderator", timestamp: target[1]})
          }
        } else {
          this.renderPerson({username: target[3], sensitive: true, role: "user", timestamp: target[1]})
        }
        var dupe = document.querySelectorAll(`.sidebar-people[data-people="members"] .sidebar-user-item[data-target="${member}" i]`)
        if (dupe.length > 1) {
          var timestamped = Array.from(dupe).map(x => Number(x.getAttribute("data-timestamp")))
          var oldest = Math.min(...timestamped)
          var instance = Array.from(dupe).filter(x => x.getAttribute("data-timestamp") == oldest)
          dupe.forEach(x => {
            var ts = x.getAttribute("data-timestamp")
            if (instance.length && x == instance[0] && ts == oldest) {
              x.setAttribute("data-dupe", dupe.length)
              x.removeAttribute("style")
            } else {
              x.style.display = "none"
            }
          })
        } else if (dupe.length == 1 && member != torch.groups[client.focus].uid) {
          dupe[0].removeAttribute("data-dupe")
          dupe[0].removeAttribute("style")
        }
      } else {
        this.renderPerson({username: target[4] != "None" ? `#${target[4]}`: chatango.getAnon(target[2], target[1]), sensitive: true, role: "guest", timestamp: target[1]})
      }
    })
  }

  setResize(x) {
    this.resize.start = x.clientX
    this.resize.width = parseInt(getComputedStyle(this.resize.element).width, 10)
    document.onmouseup = this.resizeStop
    document.onmousemove = this.resizeDrag
  }

  resizeDrag(x) {
    sidebar.resize.element.style.width = `${window.innerWidth - x.clientX}px`
  }

  resizeStop(x) {
    document.onmouseup = null
    document.onmousemove = null
  }
}

const sidebar = new Sidebar(client)

sidebar.resize.element = document.querySelector(".sidebar-resize-bar").parentNode.parentNode

document.querySelector(".sidebar-resize-bar").onmousedown = x => {
  sidebar.setResize(x)
}

sidebar.changeTab("members")

for (x in sidebar.tooltip) {
  sidebar.renderTooltip(x)
}

const roles = {
  Owner: {
    icon: "crown",
    role: "members",
    color: "var(--theme-passive)"
  },
  "Co-owner": {
    icon: "shield-quartered",
    role: "members",
    permission: "MODERATOR"
  },
  Administrator: {
    icon: "shield-halved",
    role: "members",
    permission: "MODERATOR"
  },
  Moderator: {
    icon: "shield",
    role: "members",
    permission: "MODERATOR"
  },
  User: {
    icon: "user",
    role: "members"
  },
  Bot: {
    icon: "robot",
    role: "members"
  },
  Guest: {
    icon: "user-secret",
    role: "members"
  },
  Online: {
    icon: "signal",
    role: "friends",
    color: "var(--theme-active)"
  },
  Idle: {
    icon: "moon",
    role: "friends",
    color: "var(--theme-passive)"
  },
  Offline: {
    icon: "power-off",
    role: "friends",
    color: "var(--theme-highlight)",
    collapse: true
  },
  Blocked: {
    icon: "user-slash",
    role: "friends",
    collapse: true
  },
  Ignored: {
    icon: "eye-slash",
    role: "friends",
    collapse: true
  },
  Unread: {
    icon: "envelope",
    role: "recent",
    color: "var(--theme-passive)"
  },
  Read: {
    icon: "envelope-open",
    role: "recent"
  },
  Trash: {
    icon: "trash",
    role: "recent",
    color: "var(--theme-highlight)",
    collapse: true
  },
  Spam: {
    icon: "circle-exclamation",
    role: "recent",
    color: "var(--theme-highlight)",
    collapse: true
  }
}

for (let x in roles) {
  roles[x].name = x
  sidebar.renderRole(roles[x])
}

document.querySelectorAll(".application-sidebar-people [data-role]").forEach(x => {
  var observer = new MutationObserver((mutation, observer) => {
    for (var y of mutation) {
      if (y.type == "childList") {
        y.target.previousElementSibling.querySelector("[data-count]").setAttribute("data-count", y.target.children.length)
      }
    }
  })
  observer.observe(x, {childList: true})
})

/*
`${client.user.name}_recent` in localStorage ? localStorage.getItem(`${client.user.name}_recent`).split(","): []
^^^^ RECENT PEOPLE

`${client.user.name}_curTab` in localStorage ? localStorage.getItem(`${client.user.name}_curTab`): "recent_tab"
^^^^ recent_tab OR friends_tab OR strangers_tab

*/

document.querySelector('[data-form="searchban"]').onsubmit = x => {
  x.preventDefault()
  var target = x.target.query.value.trim()
  if (target.length) {
    client.groups[client.focus].socket.send(`searchban:${target}\r\n`)
  } else {
    var selected = document.querySelector("[data-page-click]")
    if (selected) selected.removeAttribute("data-page-click")
    var page = document.querySelector(`[data-page="ban"]`)
    var number = page.querySelector("[data-page-number]")
    number.setAttribute("data-page-number", 1)
    document.querySelector('[data-page="ban"]').querySelectorAll(".modal-page-navigation").forEach(x => {
      x.classList.add("display-none")
    })
    var frame = "blocklist:block:0:next:50:anons:0"
    client.frame.blocklist = frame.split(":").slice(1)
    client.groups[client.focus].socket.send(frame + "\r\n")
  }
  x.target.query.value = ""
}

document.querySelector('[data-form="chat"]').onsubmit = x => {
  x.preventDefault()
  var target = x.target.query.value
  if (client.private) {
    client.socket("private_message", `connect:${target}`, "An ewwow occuwwed.")
  } else {
    client.systemMessage({content: "Private messages have not been opened."})
  }
  x.target.query.value = ""
}

document.querySelector('[data-form="chat"] .application-chat-icon').onclick = () => {
  document.querySelector('[data-sidebar="private"]').click()
}

document.querySelector('[data-sidebar="private"]').onclick = x => {
  var group = "private_message"
  var iframe = document.querySelector(".application-content iframe")
  if (iframe) {
    iframe.classList.add("display-none")
  }
  document.querySelector(".application-chat").classList.remove("display-none")
  if (!client.private) {
    client.setConnect({enable: true, icon: "spinner", animation: "rotation 1.5s linear infinite", content: "Connecting..."})
    client.groups[client.focus].ready = false
    var storage = indexedDB.open(`${client.user.name}_history`, 1)
    storage.onsuccess = x => {
      client.database.pm = x.target.result
      client.connect(group).then(socket => {
        client.cache.connect = client.cache.connect.filter(x => x != group)
        chatango.renderMini(document.querySelector(".application-private"), {username: client.user.name, clean: true}).then(profile => {
          client.focus = group
          var select = document.querySelector(".sidebar-group-select")
          if (select) {
            select.classList.remove("sidebar-group-select")
          }
          document.querySelector('[data-sidebar="private"]').classList.add("sidebar-group-select")
          document.querySelector(".chat-meta-cancel").click()
          document.querySelector(".application-chat-wrapper").replaceChildren()
          client.renderMessage({content: "Private messages", banner: true, unique: "begin", position: "afterbegin"})
          client.systemMessage({content: "Start a conversation or view your recent messages."})
          client.private.setImport()
          document.querySelector(".server-title").textContent = "Private messages"
          document.querySelector(".server-description").textContent = "Stay safe!"
          document.querySelector('[data-toolbar="settings"] span').className = "toolbar-icon fa-solid fa-user-magnifying-glass"
          if (client.settings.privacy.private_messages.check_pmr) {
            fetch(`//api.vissle.me/v1/pmr/${client.user.name}`).then(async response => {
              if (response.status == 200) {
                var restricted = await response.json()
                if (!restricted.pmr) {
                  client.private.pmr = {content: "Your private messaging status is in good standing.", avatar: "check"}
                  client.systemMessage(client.private.pmr)
                } else {
                  client.private.pmr = {content: "You appear to be private message restricted.", avatar: "x"}
                  client.systemMessage(client.private.pmr)
                }
              }
            })
          }
          var amount = document.querySelector('[data-sidebar="private"]').getAttribute("data-amount")
          if (amount) {
            document.querySelector('[data-sidebar="private"]').classList.remove("application-icon-mention")
            document.querySelector('[data-sidebar="private"]').setAttribute("data-amount", 0)
            sidebar.changeTab("recent")
          } else {
            sidebar.changeTab("friends")
          }
          client.setConnect({icon: "spinner", content: "Connecting..."})
          client.setPlaceholder({enable: "false", content: "Private messages", clear: true})
          if (client.settings.appearance.messages.preview_message) {
            client.setInput({content: "Private messages", clear: true})
          }
        })
      }).catch(error => {
        client.cache.connect = client.cache.connect.filter(x => x != group)
        client.setConnect({icon: "spinner", content: "Connecting..."})
        client.systemMessage({content: error})
      })
    }
    storage.onerror = () => {
      client.cache.connect = client.cache.connect.filter(x => x != group)
      client.setConnect({icon: "spinner", content: "Connecting..."})
      client.systemMessage({content: "could not access pm db"})
    }
    storage.onupgradeneeded = x => {
      var db = x.target.result
      var start = db.createObjectStore("messages", {keyPath: "ts"})
      start.createIndex("target_idx", "target", {unique: false})
      start.createIndex("target_read_idx", ["target", "unread"], {unique: false})
      start.createIndex("target_ts_idx", ["target", "ts"], {unique: false})
      start.transaction.oncomplete = y => {
        console.log("db updated")
      }
    }
  } else if (client.focus != "private_message" && client.private.focus) {
    client.focus = group
    var item = document.querySelector(`[data-people="friends"] [data-target="${client.private.focus}"], [data-people="recent"] [data-target="${client.private.focus}"]`)
    if (item) {
      client.private.setFocus({username: client.private.focus, status: item.getAttribute("data-status"), timestamp: item.getAttribute("data-timestamp")})
    } else {
      console.log("no target")
    }
  } else {
    client.setConnect({enable: true, icon: "spinner", animation: "rotation 1.5s linear infinite", content: "Connecting..."})
    if (x.currentTarget.getAttribute("data-amount") == "!") {
      client.connect(group).then(socket => {
        client.cache.connect = client.cache.connect.filter(x => x != group)
        document.querySelector(".application-notice-dismiss").click()
        client.private.initiate()
      }).catch(error => {
        console.log(error)
        client.cache.connect = client.cache.connect.filter(x => x != group)
        client.setConnect({icon: "spinner", content: "Connecting..."})
        client.systemMessage({content: error})
      })
    } else {
      client.private.initiate()
    }
  }
}

document.querySelector('[data-sidebar="track"]').onclick = () => {
  var exist = document.querySelector(".application-content iframe")
  document.querySelector(".application-chat").classList.add("display-none")
  document.querySelector(".application-private").classList.add("display-none")
  document.querySelector('[data-sidebar="track"]').classList.remove("application-icon-mention")
  if (exist) {
    exist.classList.remove("display-none")
  } else {
    client.setConnect({enable: true, icon: "spinner", animation: "rotation 1.5s linear infinite", content: "Connecting..."})
    var iframe = document.createElement("iframe")
    iframe.src = `${torch.domain}/track`
    iframe.onload = () => {
      iframe.contentWindow.postMessage({user: client.user.name}, "*")
      client.setConnect({content: "Connecting..."})
    }
    iframe.onerror = () => {
      client.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: "An error occurred in loading the tracker."})
      client.setConnect({content: "Connecting..."})
      iframe.remove()
    }
    document.querySelector(".application-chat").insertAdjacentElement("beforebegin", iframe)
  }
}

document.querySelector('[data-sidebar="plus"]').onclick = () => {
  var preload = document.querySelector('[data-window="index"]')
  client.renderWindow({
    id: "index",
    title: "Join group",
    icon: "right-to-bracket",
    width: "50vw",
    height: "60vh",
    top: "20vh",
    left: "25vw",
    buttons: {
      Create: x => client.renderWindow({
        id: "index",
        title: "Create group",
        icon: "circle-plus",
        page: x
      }),
      Discover: x => client.renderWindow({
        id: "index",
        title: "Discover groups",
        icon: "compass",
        page: x
      })
    },
    toggle: true,
    page: {
      join: false,
      create: false,
      discover: false
    }
  })
  if (!preload) {
    var join = document.querySelector('[data-preload="join"]')
    join.className = "chat-window-inside flex-direction-column"
    document.querySelector('[data-window="index"]').querySelector('[data-page="Join"]').appendChild(join)
    var create = document.querySelector('[data-preload="create"]')
    create.className = "chat-window-inside"
    document.querySelector('[data-window="index"]').querySelector('[data-page="Create"]').appendChild(create)
    document.querySelector('[data-window="index"]').querySelector('[data-page="Create"]').querySelector(".sidebar-group-avatar").onclick = x => {
      x.currentTarget.parentNode.parentNode.querySelector('[type="file"]').click()
    }
    document.querySelector('[data-window="index"]').querySelector('[data-page="Create"]').querySelector('[type="file"]').onchange = x => {
      if (x.target.files) {
        document.querySelector('[data-window="index"]').querySelector('[data-page="Create"]').querySelector(".sidebar-group-avatar").src = URL.createObjectURL(x.target.files[0])
      }
    }
    document.querySelector('[data-window="index"]').querySelector('[data-page="Create"]').querySelector(".sidebar-group-avatar").onkeyup = x => {
      if (x.code == "Space") {
        x.currentTarget.click()
      }
    }
    document.querySelector('[data-form="create"] [data-button="join"]').onclick = () => {
      document.querySelector('[data-window="index"] [data-button="Join"]').click()
      document.querySelector('[data-window="index"] .chat-window-option').classList.add("display-none")
    }
    document.querySelector('[data-form="join"] [data-button="create"]').onclick = () => {
      document.querySelector('[data-window="index"] [data-button="Create"]').click()
      document.querySelector('[data-window="index"] .chat-window-option').classList.add("display-none")
    }
    var discover = document.querySelector('[data-preload="discover"]')
    discover.className = "chat-window-inside flex-direction-column"
    document.querySelector('[data-window="index"]').querySelector('[data-page="Discover"]').appendChild(discover)
  }
}

function setPurchase(data, query) {
  var select = document.querySelector(".external-purchase-select")
  select.classList.remove("external-purchase-select")
  var element = document.querySelector(`.external-purchase-item[data-step="${query}"]`)
  if (data) {
    element.querySelector(".external-modal-link").textContent = data
  }
  if (query == "account") {
    element.querySelector(".field-display.display-flex-align").removeAttribute("style")
  }
  element.classList.add("external-purchase-select")
}

document.querySelector('.external-modal-purchase [data-button="premium"]').onclick = () => {
  setPurchase(`You are about to purchase Chatango Premium.\n${client.groups[client.focus].premium}`, "premium")
}

document.querySelector('.external-modal-purchase [data-button="inactive"]').onclick = () => {
  setPurchase("You are about to purchase an inactive Chatango account.", "account")
}

document.querySelector('.external-modal-purchase [data-step="account"] [data-button="back"]').onclick = () => {
  setPurchase(false, "purchase")
}

document.querySelector('.external-modal-purchase [data-step="card"] [data-button="back"]').onclick = () => {
  setPurchase(false, "payment")
}

document.querySelectorAll(".external-purchase-item .sidebar-user-item[data-amount]").forEach(x => {
  x.onclick = () => {
    var amount = x.getAttribute("data-amount")
    if (amount == 20) {
      setPurchase("You may enter multiple inactive Chatango accounts for purchase.", "account")
    } else if (amount == 0.95) {
      setPurchase(false, "payment")
    } else {
      var clone = x.cloneNode(true)
      setPurchase("Enter account names you want to gift Chatango Premium to.", "account")
      document.querySelector('[data-step="account"] .field-display.display-flex-align').style.display = "none"
    }
  }
})

document.querySelector('[data-step="payment"] .filter-paypal').onclick = () => {
  setPurchase(false, "paypal")
}

document.querySelector('[data-step="payment"] .filter-reset').onclick = () => {
  setPurchase(false, "card")
}

document.querySelector('[data-step="payment"] [data-button="back"]').onclick = () => {
  setPurchase(false, "purchase")
}

document.querySelector('[data-form="purchase"]').onsubmit = x => {
  x.preventDefault()
  var username = x.target.user_id.value
  fetch(`${torch.domain}/api/v1/profile/${username}?get=purchase`).then(async response => {
    var data = await response.json()
    var available = {
      title: data.purchase.buy ? "Available": "Unavailable",
      color: data.purchase.buy ? "theme-active": "theme-highlight"
    }
    if (data.purchase.message.length == 1) {
      if (data.purchase.message.includes("is not expired.")) {
        available.title = "Preorder"
        available.color = "brand-chatango"
      }
    }
    sidebar.renderItem({
      item: data.target ? data.target: username,
      index: "purchase",
      icon: "profile picture",
      select: false,
      title: available.title,
      color: available.color,
      position: "afterbegin",
      extra: data.response ? data.purchase.message.map(x => `${data.target} ${x}`).concat([data.purchase.time]): [data.message],
      more: {
        "fa-solid fa-chevron-down": y => {
          y.currentTarget.classList.contains("fa-chevron-down") ? y.currentTarget.className = "group-more-item fa-solid fa-chevron-up": y.currentTarget.className = "group-more-item fa-solid fa-chevron-down"
          var target = y.currentTarget.parentNode.nextElementSibling
          target.style.maxHeight ? target.removeAttribute("style"): target.style.maxHeight = target.scrollHeight + "px"
        },
        "fa-solid fa-x": y => {
          y.currentTarget.parentNode.parentNode.remove()
        }
      }
    })
    //document.querySelector('[data-index="purchase"]').querySelectorAll(".text-active").length * 20
  }).catch(error => {
    console.log(error)
  })
  x.target.user_id.value = ""
}

/*
document.querySelector('[data-form="premium"]').onsubmit = x => {
  x.preventDefault()
  var username = x.target.user_id.value
  fetch(`${torch.domain}/api/v1/profile/${username}?get=mini,background`).then(async response => {
    var data = await response.json()
    var available = {
      title: "Unavailable",
      color: "text-highlight"
    }
    if (data.response) {
      available.title = "Gift"
      available.color = "theme-active"
    }
    sidebar.renderItem({
      item: data.target ? data.target: username,
      index: "premium",
      icon: "profile picture",
      select: false,
      title: available.title,
      color: available.color,
      position: "afterbegin",
      extra: data.response ? [`Premium ${data.background.time.toLowerCase()}`]: [data.message],
      more: {
        "fa-solid fa-chevron-down": y => {
          y.currentTarget.classList.contains("fa-chevron-down") ? y.currentTarget.className = "group-more-item fa-solid fa-chevron-up": y.currentTarget.className = "group-more-item fa-solid fa-chevron-down"
          var target = y.currentTarget.parentNode.nextElementSibling
          target.style.maxHeight ? target.removeAttribute("style"): target.style.maxHeight = target.scrollHeight + "px"
        },
        "fa-solid fa-x": y => {
          y.currentTarget.parentNode.parentNode.remove()
        }
      }
    })
    //document.querySelector('[data-index="premium"]').querySelectorAll(".text-active").length * 20
  }).catch(error => {
    console.log(error)
  })
  x.target.user_id.value = ""
}
*/

document.querySelector('[data-form="create"]').onsubmit = x => {
  x.preventDefault()
  var form = new FormData(x.target)
  var icon = new FormData()
  form.set("owner", client.user.name)
  if (!form.get("icon").name.length) {
    icon.set("icon", form.get("icon"))
  }
  form.delete("icon")
  client.post(chatango.path("script/creategrouploginjs", "st"), form, {
    cookie: true
  }).then(async response => {
    var message = response.trim()
    var warning = message.split("&")
    if (message == "groupcreated") {
      client.setNotice({enable: true, icon: "check", color: "var(--theme-active)", content: "Successfuly created group."})
    } else if (message in chatango.error.creategroup) {
      client.setNotice({enable: true, icon: "warning", color: "var(--theme-passive)", content: chatango.error.creategroup[message]})
    } else if (warning[0] == "error_message" && warning[1] in chatango.error.creategroup) {
      var wrong = warning[1]
      client.setNotice({enable: true, icon: "warning", color: "var(--theme-passive)", content: chatango.error.creategroup[wrong]})
    } else {
      client.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: message})
    }
  }).catch(error => {
    client.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: error.message})
  })
}

document.querySelector('[data-form="join"]').onsubmit = async x => {
  x.preventDefault()
  var value = punycode.toASCII(x.target.group.value)
  var regex = {
    name: value.match(/^([a-z0-9-_]{1,20})$/i),
    invite: value.match(/client.chatango.com\/q\?([a-z0-9-_]{1,20})/i),
    link: value.match(/([a-z0-9-_]{1,20}).chatango.com/i)
  }
  if (regex.name || regex.link) {
    var group = regex.link ? regex.link[1]: regex.name[1]
    var closed = document.querySelector('[data-preload="join"]').classList.contains("display-none")
    if (!closed) {
      document.querySelector('[data-window="index"]').querySelector(".window-option-item").click()
      document.querySelector('[data-window="index"]').querySelector(".chat-window-option").classList.add("display-none")
    }
    if (group in client.groups && client.groups[group].socket.readyState == client.groups[group].socket.OPEN) {
      client.setFocus({group: group, reload: true})
    } else {
      client.setConnect({enable: true, icon: "spinner", animation: "rotation 1.5s linear infinite", content: "Connecting..."})
      var previous = client.focus
      await fetch(`${torch.domain}/chatango/group`, {
        method: "POST",
        body: JSON.stringify({get: [group]})
      }).then(async response => {
        var item = await response.json()
        torch.groups[group] = item[group]
      }).catch(error => {
        client.systemMessage({content: "Could not fetch group ID."})
      })
      if (client.focus == group) {
        client.groups[group].load = 0
        document.querySelector(".application-chat-wrapper").replaceChildren()
      }
      client.connect(group).then(socket => {
        client.cache.connect = client.cache.connect.filter(x => x != group)
        var exist = document.querySelector(`.sidebar-group-item [data-group="${group}"]`)
        if (client.settings.safety.groups.warn_unsafe && client.groups[group].room.flag.indexOf("UNSAFE") >= 0 && !exist) {
          var content = 'This group has been marked as unsafe by <span style="color: var(--brand-chatango);">Chatango</span>.'
          var proceed = `Do you wish to proceed to <span style="color: var(--theme-passive);">#${group}</span>?`
          client.setConnect({enable: true, icon: "warning", color: "var(--theme-passive)", content: content, confirm: proceed,
            action: {
              yes: () => {
                client.setConnect({icon: "spinner", content: "Connecting..."})
                sidebar.renderGroup({group: group, header: client.groups[group].room.information.title, recent: true})
                client.setFocus({group: group, reload: true, force: true})
              },
              no: () => {
                client.setConnect({icon: "spinner", content: "Connecting..."})
                client.disconnectFrom(group)
              }
            }
          })
        } else {
          sidebar.renderGroup({group: group, header: client.groups[group].room.information.title, recent: true})
          client.setConnect({icon: "spinner", content: "Connecting..."})
          if (client.focus != group) {
            client.setFocus({group: group, reload: true})
          }
        }
      }).catch(error => {
        console.log(error)
        client.cache.connect = client.cache.connect.filter(x => x != group)
        client.setConnect({icon: "spinner", content: "Connecting..."})
        client.systemMessage({content: error.message || error})
      })
    }
  } else if (regex.invite) {
    console.log(regex.invite[1])
  } else {
    alert("invalid invite")
  }
  x.target.group.value = ""
}

document.querySelector('[data-sidebar="user"]').onclick = x => {
  client.messageAction(x.currentTarget, "user_settings", false, false, x)
}

document.querySelector('[data-sidebar="user"]').oncontextmenu = x => {
  x.preventDefault()
  client.setContext(x.currentTarget, {action: ["user_status", "user_settings", "user_switch", "user_logout"], height: true, top: 15, left: -62, toggle: true})
}

document.querySelector('[data-form="uploadimg"]').onsubmit = x => {
  x.preventDefault()
  var form = new FormData(x.target)
  var server = x.currentTarget.getAttribute("data-server")
  var payload = {
    progress: true,
    status: {
      401: () => {
        client.setNotice({icon: "warning", color: "var(--theme-passive)", content: "Unauthorized, please log in."})
      },
      403: () => {
        client.setNotice({icon: "warning", color: "var(--theme-passive)", content: "Unauthorized, not logged in."})
      },
      422: () => {
        client.setNotice({icon: "warning", color: "var(--theme-passive)", content: "Server could not handle request."})
      }
    }
  }
  server.startsWith("https://chatango.com") ? payload.credential = "u": payload.key = true
  client.post(server, form, payload).then(async response => {
    console.log("baka")
  }).catch(error => {
    console.log(error)
  })
}

/* APPLICATION HEADER FUNCTIONS */

document.querySelector('[data-toolbar="group"]').onclick = () => {
  var select = document.querySelector(".application-sidebar").style.display
  if (select == "flex") {
    document.querySelector(".application-sidebar").removeAttribute("style")
  } else {
    document.querySelector(".application-sidebar").style.display = "flex"
  }
}

document.querySelector(".application-detail-group").onclick = x => {
  client.renderWindow({
    id: "information",
    title: x.currentTarget.querySelector(".server-title").textContent,
    icon: "circle-info",
    width: "50vw",
    height: "45vh",
    buttons: {
      Rules: y => client.renderWindow({
        id: "information",
        title: `#${client.focus} rules`,
        icon: "book",
        page: y
      })
    },
    toggle: true,
    page: {
      information: x.currentTarget.querySelector(".server-description").textContent,
      rules: "No rules set."
    }
  })
}

document.querySelector(".application-detail-group").onkeyup = x => {
  if (x.code == "Space") {
    x.currentTarget.click()
  }
}

document.querySelector('[data-toolbar="toggle"]').onclick = x => {
  document.querySelector(".application-chat-sidebar").classList.toggle("display-none")
  x.currentTarget.classList.toggle("application-icon-active")
}

document.querySelector('[data-toolbar="toggle"]').onkeyup = x => {
  if (x.code == "Space") {
    x.currentTarget.click()
  }
}

function revertAutocomplete(revert) {
  document.querySelector(".field-autocomplete").replaceWith(revert)
  document.querySelector('[data-preload="search"]').querySelectorAll(".autocomplete-item").forEach(x => {
    x.onclick = y => {
      var value = document.querySelector('[data-preload="search"]').querySelector("input").value
      var complete = y.currentTarget.getAttribute("data-autocomplete")
      if (value.indexOf(complete) < 0) {
        var space = value.endsWith(" ")
        if (!x.parentNode.getAttribute("data-autofill") && value && !space) {
          complete = ` ${complete}`
        }
        document.querySelector('[data-preload="search"]').querySelector("input").value += complete
        document.querySelector(".field-autocomplete").setAttribute("data-autofill", complete)
        if (complete == "from:") {
          document.querySelector(".field-autocomplete").replaceChildren()
          var message = document.querySelector(".application-chat-wrapper").querySelectorAll(".chat-message")
          var index = Array.from(message).map(z => z.querySelector(".chat-message-username").textContent.toLowerCase())
          var member = index.filter((z, a) => index.indexOf(z) == a)
          member.forEach(z => {
            var bruh = document.createElement("span")
            bruh.className = "autocomplete-item"
            bruh.setAttribute("data-autocomplete", z)
            bruh.textContent = z[0].toUpperCase() + z.slice(1)
            document.querySelector(".field-autocomplete").appendChild(bruh)
          })
          document.querySelector('[data-preload="search"]').querySelectorAll(".autocomplete-item").forEach(z => {
            z.onclick = a => {
              var value = document.querySelector('[data-preload="search"]').querySelector("input").value
              var complete = a.currentTarget.getAttribute("data-autocomplete")
              if (value.indexOf(complete) < 0) {
                document.querySelector('[data-preload="search"]').querySelector("input").value += `${complete} `
              }
              document.querySelector(".field-autocomplete").replaceWith(revert)
            }
            z.onmousedown = a => {
              a.preventDefault()
            }
          })
        }
      }
    }
    x.onmousedown = y => {
      y.preventDefault()
    }
  })
}

document.querySelectorAll('[data-toolbar="search"]').forEach(x => {
  var revert = document.querySelector(".field-autocomplete").cloneNode(true)
  client.autocomplete = revert
  x.onclick = () => {
    var preload = document.querySelector('[data-window="search"]')
    client.renderWindow({
      id: "search",
      title: "Search messages",
      icon: "comments",
      width: "300px",
      height: "40vh",
      buttons: {
        Users: y => client.renderWindow({
          id: "search",
          title: "Search users",
          icon: "circle-user",
          page: y
        })
      },
      toggle: true,
      page: {
        group: false,
        users: false
      }
    })
    if (!preload) {
      var search = document.querySelector('[data-preload="search"]')
      search.className = "chat-window-inside"
      document.querySelector('[data-window="search"]').querySelector('[data-page="Group"]').appendChild(search)
      document.querySelector('[data-preload="search"]').querySelector("input").onfocus = x => {
        if (!x.currentTarget.value.length) {
          revertAutocomplete(client.autocomplete)
        }
        document.querySelector('[data-preload="search"]').querySelector(".field-autocomplete").classList.remove("display-none")
      }
      document.querySelector('[data-preload="search"]').querySelector("input").onblur = () => {
        document.querySelector('[data-preload="search"]').querySelector(".field-autocomplete").classList.add("display-none")
        var select = document.querySelector('[data-preload="search"]').querySelector(".autocomplete-select")
        if (select) {
          select.classList.remove("autocomplete-select")
        }
      }
      document.querySelector('[data-preload="search"]').querySelector("input").onkeydown = y => {
        if (y.code == "ArrowUp") {
          y.preventDefault()
          var previous = document.querySelector('[data-preload="search"]').querySelector(".autocomplete-select")
          if (!previous) {
            var sibling = document.querySelector('[data-preload="search"]').querySelectorAll(".autocomplete-item")
            Array.from(sibling).slice(-1)[0].classList.add("autocomplete-select")
          } else if (previous.previousElementSibling) {
            previous.classList.remove("autocomplete-select")
            previous.previousElementSibling.classList.add("autocomplete-select")
          } else {
            previous.classList.remove("autocomplete-select")
            var sibling = document.querySelector('[data-preload="search"]').querySelectorAll(".autocomplete-item")
            Array.from(sibling).slice(-1)[0].classList.add("autocomplete-select")
          }
        } else if (y.code == "ArrowDown") {
          y.preventDefault()
          var next = document.querySelector('[data-preload="search"]').querySelector(".autocomplete-select")
          if (!next) {
            document.querySelector('[data-preload="search"]').querySelector(".autocomplete-item").classList.add("autocomplete-select")
          } else if (next.nextElementSibling) {
            next.classList.remove("autocomplete-select")
            next.nextElementSibling.classList.add("autocomplete-select")
          } else {
            next.classList.remove("autocomplete-select")
            document.querySelector('[data-preload="search"]').querySelector(".autocomplete-item").classList.add("autocomplete-select")
          }
        } else if (y.code == "Enter") {
          var select = document.querySelector('[data-preload="search"]').querySelector(".autocomplete-select")
          if (select) {
            select.click()
          }
        }
      }
      document.querySelector('[data-form="searchmessage"]').onsubmit = y => {
        y.preventDefault()
        var value = y.target.query.value.trim()
        if (value) {
          var regex = {
            from: value.match(/from:([a-z0-9]{1,20})/i),
            mentions: value.match(/mentions:([a-z0-9]{1,20})/i),
            includes: value.match(/includes:(link|image)/i),
            channel: value.match(/channel:(red|blue)/i),
            flag: value.match(/flag:(\d+)/)
          }
          var matches = []
          if (regex.from) {
            matches = document.querySelectorAll(`.application-chat-wrapper .chat-message[data-user="${regex.from[1]}"]`)
          }
          if (regex.mentions) {
            matches = Array.from(matches).filter(z => {
              return Array.from(z.querySelectorAll(".chat-message-content .chat-item-mention")).filter(a => a.textContent.toLowerCase().includes(regex.mentions[1])).length
            })
          }
          if (regex.includes) {
            matches = Array.from(matches).filter(z => {
              return regex.includes[1] == "link" ? z.querySelectorAll(".chat-message-content a").length: z.querySelectorAll(".chat-message-content img").length
            })
          }
          if (regex.channel) {
            console.log(regex.channel)
          }
          if (regex.flag) {
            console.log(regex.flag)
          }
          console.log(matches)
        }
      }
      document.querySelector('[data-preload="search"]').querySelector("input").onkeyup = y => {
        var fill = document.querySelector(".field-autocomplete").getAttribute("data-autofill")
        if (fill) {
          var value = y.currentTarget.value.toLowerCase().slice(fill.length)
        } else {
          var value = y.currentTarget.value.toLowerCase()
        }
        y.currentTarget.parentNode.querySelectorAll(".autocomplete-item").forEach(z => {
          if (z.getAttribute("data-autocomplete").indexOf(value) >= 0) {
            z.classList.remove("display-none")
          } else {
            z.classList.add("display-none")
          }
        })
        if (y.shiftKey && y.code == "Semicolon") {
          var option = y.currentTarget.parentNode.querySelectorAll(".autocomplete-item")
          var item = Array.from(option).filter(z => !z.classList.contains("display-none"))
          if (item.length) {
            var message = document.querySelector(".application-chat-wrapper").querySelectorAll(".chat-message")
            var index = Array.from(message).map(z => z.querySelector(".chat-message-username").textContent.toLowerCase())
            var member = index.filter((z, a) => index.indexOf(z) == a)
            if (item[0].textContent.trim() == "From") {
              document.querySelector(".field-autocomplete").setAttribute("data-autofill", "from:")
              document.querySelector(".field-autocomplete").replaceChildren()
              member.forEach(z => {
                var bruh = document.createElement("span")
                bruh.className = "autocomplete-item"
                bruh.setAttribute("data-autocomplete", z)
                bruh.textContent = z[0].toUpperCase() + z.slice(1)
                document.querySelector(".field-autocomplete").appendChild(bruh)
              })
              document.querySelector('[data-preload="search"]').querySelectorAll(".autocomplete-item").forEach(z => {
                z.onclick = a => {
                  var value = document.querySelector('[data-preload="search"]').querySelector("input").value
                  var complete = a.currentTarget.getAttribute("data-autocomplete")
                  if (value.indexOf(complete) < 0) {
                    document.querySelector('[data-preload="search"]').querySelector("input").value += `${complete} `
                  }
                  revertAutocomplete(client.autocomplete)
                }
                z.onmousedown = a => {
                  a.preventDefault()
                }
              })
            }
          }
        } else if (value.endsWith(" ")) {
          revertAutocomplete(client.autocomplete)
        }
      }
    }
  }
})

document.querySelector('[data-toolbar="search"]').onkeyup = x => {
  if (x.code == "Space") {
    x.currentTarget.click()
  }
}

document.querySelector('[data-advanced="inbox"]').onclick = x => {
  filterModal({
    id: "inbox",
    title: "Filter inbox",
    icon: "fa-inbox",
    toggles: {
      "Last focused user only": {
        id: "last",
        on: true
      },
      "Show my own messages": {
        id: "own",
        on: true
      },
      Spam: {
        id: "spam"
      }
    }
  })
  document.querySelector(".filter").classList.add("filter-view")
  document.querySelector(".filter-items").focus()
}

document.querySelectorAll('[data-toolbar="mention"]').forEach(x => {
  x.onclick = y => {
    var preload = document.querySelector('[data-window="mentions"]')
    client.renderWindow({
      id: "mentions",
      title: "Mentions",
      icon: "at",
      width: "40vw",
      height: "40vh",
      top: "25vh",
      left: "30vw",
      buttons: {
        Inbox: z => client.renderWindow({
          id: "mentions",
          title: "Inbox",
          icon: "inbox",
          page: z
        })
      },
      toggle: true,
      page: {
        group: false,
        inbox: false
      }
    })
    if (!preload) {
      var mentions = document.querySelector('[data-preload="mentions"]')
      mentions.className = "chat-window-inside flex-direction-column"
      document.querySelector('[data-window="mentions"]').querySelector('[data-page="Group"]').appendChild(mentions)
      var inbox = document.querySelector('[data-preload="inbox"]')
      inbox.className = "chat-window-inside flex-direction-column"
      document.querySelector('[data-window="mentions"]').querySelector('[data-page="Inbox"]').appendChild(inbox)
    }
    y.currentTarget.classList.remove("application-icon-mention")
  }
})

document.querySelector('[data-toolbar="mention"]').onkeyup = x => {
  if (x.code == "Space") {
    x.currentTarget.click()
  }
}

document.querySelector('[data-toolbar="menu"]').onclick = () => {
  var select = document.querySelector(".application-chat-sidebar").style.display
  if (select == "flex") {
    document.querySelector(".application-chat-sidebar").style.removeProperty("display")
  } else {
    document.querySelector(".application-chat-sidebar").style.display = "flex"
  }
}

document.querySelector('[data-form="searchMeet"] .application-chat-icon').onclick = () => {
  var value = document.querySelector('[data-form="searchMeet"] input').value
  var data = {reload: true}
  if (value.length) {
    data.query = value
  } else {
    delete client.private.meet.payload.query
  }
  client.private.meetPeople(data)
}

document.querySelector('[data-form="searchMeet"]').onsubmit = x => {
  x.preventDefault()
  client.private.meetPeople({reload: true, query: x.target.query.value})
}

document.querySelector('[data-advanced="meet"]').onclick = x => {
  filterModal({
    id: "meet",
    title: "Filter meet people",
    icon: "fa-user-magnifying-glass",
    toggles: {
      "Male": {
        id: "sex:M",
        on: true
      },
      "Female": {
        id: "sex:F",
        on: true
      },
      "Online": {
        id: "online:1",
        on: true
      },
      "Real avatar": {
        id: "avatar:1",
        on: true
      },
      "Character avatar": {
        id: "avatar:2",
        on: true
      }
    }
  })
  document.querySelector(".filter").classList.add("filter-view")
  document.querySelector(".filter-items").focus()
  document.querySelector(".filter-apply").onclick = () => {
    var value = document.querySelector('[data-form="searchMeet"] input').value
    var data = {
      age: {start: 13, end: 99},
      sex: [],
      avatar: []
    }
    if (value.length) {
      data.query = value
    }
    document.querySelector(".filter").classList.remove("filter-view")
    Array.from(document.querySelector(".filter-items").children).forEach(y => {
      if (y.querySelector("input").checked) {
        var item = y.querySelector("input").getAttribute("data-filter-id").split(":")
        var query = item[0]
        var parameter = item[1]
        if (["sex", "avatar"].includes(query)) {
          data[query].push(parameter)
        } else {
          data[query] = parameter
        }
      }
    })
    client.private.meetPeople(data)
  }
  if (x.currentTarget.getAttribute("data-filter-first") != 1) {
    x.target.setAttribute("data-filter-first", 1)
    var reset = Array.from(document.querySelector(".filter-items").cloneNode(true).children).map(y => y.querySelector("input").checked)
    document.querySelector(".filter-reset").onclick = () => {
      document.querySelector(".filter-items").focus()
      Array.from(document.querySelector(".filter-items").children).forEach((y, z) => {
        if (y.querySelector("input").checked != reset[z]) {
          y.querySelector("input").click()
        }
      })
    }
  }
}

document.querySelector('[data-toolbar="settings"]').onclick = x => {
  var current = {
    meet: x.currentTarget.firstElementChild.classList.contains("fa-user-magnifying-glass"),
    list: x.currentTarget.firstElementChild.classList.contains("fa-user-xmark")
  }
  if (current.meet) {
    x.currentTarget.firstElementChild.className = "toolbar-icon fa-solid fa-user-xmark"
    document.querySelector(".application-chat-meet").classList.remove("display-none")
    document.querySelector(".application-chat-users").classList.add("display-none")
    document.querySelector(".application-chat-with").classList.add("display-none")
    document.querySelector(".application-chat-search").classList.remove("display-none")
    if (!document.querySelector(".application-chat-meet .application-profile-container")) {
      var data = {
        age: {start: 13, end: 99},
        sex: ["B"],
        online: 1
      }
      client.private.meetPeople(data)
    }
  } else if (current.list) {
    client.private.hideMeet()
  } else {
    client.previous = "groupSettings"
    history.pushState({name: "groupSettings"}, "", location.href)
    document.querySelector('[data-modal="groupSettings"]').classList.add("modal-view")
    var notice = document.querySelector(".application-notice")
    document.querySelector('[data-modal="groupSettings"] .modal-option-select').prepend(notice)
    if (!document.querySelector('[data-modal="groupSettings"] .cropper-hidden') && torch.groups[client.focus].uid) {
      new Cropper(document.querySelector(".group-icon-full"), {
        aspectRatio: 1,
        viewMode: 2,
        preview: ".group-icon-preview",
        checkOrientation: true,
        ready() {
          console.log("load group icon")
          var ratio = this.cropper.imageData.width / this.cropper.imageData.naturalWidth
          var data = torch.groups[client.focus]
          this.cropper.setCropBoxData({top: data.y0 < 0 ? 0: data.y0 * ratio, left: data.x0 < 0 ? 0: data.x0 * ratio, width: data.ts < 0 ? 400: data.ts * ratio, height: data.ts < 0 ? 400: data.ts * ratio})
        }
        //crop(x) {console.log(x.detail)}
      })
    }
  }
}

/* APPLICATION CHAT FUNCTIONS */

document.querySelector('[data-form="setstatus"]').onsubmit = x => {
  x.preventDefault()
  var form = new FormData(x.target)
  var entry = Object.fromEntries(form)
  client.user.away.enable = !!entry.note.length
  client.user.away.message = entry.note
  client.user.away.sent = []
  var timer = 0
  var date = new Date()
  var seconds = (24 * 60 * 60) - (date.getHours() * 60 * 60) - (date.getMinutes() * 60) - date.getSeconds()
  switch (+entry.removeAfter) {
    case 0:
      timer = false
      break;
    case 1:
      timer = seconds
      break;
    default:
      timer = +entry.removeAfter
  }
  client.user.away.timeout = !timer ? 0: setTimeout(() => {
    document.querySelector('[data-form="setstatus"]').reset()
  }, timer * 1000)
  client.socket("private_message", `idle:${entry.displayStatus}`, `Could not set status to ${entry.displayStatus == "0" ? "idle": "online"}`)
}

document.querySelector('[data-form="setstatus"]').onreset = x => {
  client.user.away.enable = false
  client.user.away.message = false
  client.user.away.sent = []
  clearTimeout(client.user.away.timeout)
  client.socket("private_message", `idle:1`, "Could not set status to online")
}

document.querySelector('[data-send="channels"]').onclick = () => {
  var preload = document.querySelector('[data-window="channels"]')
  client.renderWindow({
    id: "channels",
    title: "Channels",
    icon: "hashtag",
    top: "33vh",
    left: "50vh",
    buttons: {
      Filter: y => client.renderWindow({
        id: "channels",
        title: "Filter",
        icon: "filter",
        page: y
      }),
      Badges: y => client.renderWindow({
        id: "channels",
        title: "Badges",
        icon: "badge-check",
        page: y
      })
    },
    toggle: true,
    page: {
      channels: false,
      filter: false,
      badges: false
    }
  })
  if (!preload) {
    for (let x in chatango.flags.channel) {
      if (chatango.flags.channel[x].value) {
        var item = document.createElement("div")
        item.className = "channel-item"
        item.setAttribute("data-channel", x)
        item.setAttribute("data-flag", chatango.flags.channel[x].value)
        if (client.groups[client.focus].room.flag.indexOf("NO_CHANNELS") >= 0) {
          item.setAttribute("data-disabled", true)
        }
        var color = document.createElement("span")
        color.className = "channel-item-color"
        if (x == "mod") {
          color.style.background = chatango.flags.channel[x].hex
          item.setAttribute("data-user-permission", "SEE_MOD_CHANNEL")
          if (client.groups[client.focus].user.moderator) {
            if (!client.groups[client.focus].room.moderator[client.user.name].includes("SEE_MOD_CHANNEL")) {
              item.setAttribute("disabled", true)
            }
          } else if (client.groups[client.focus].room.owner != client.user.name) {
            item.setAttribute("disabled", true)
          }
        } else {
          color.style.backgroundColor = chatango.flags.channel[x].hex
        }
        item.appendChild(color)
        var channel = document.createElement("span")
        channel.className = "channel-item-name"
        channel.textContent = `${x[0].toUpperCase() + x.slice(1)} channel`
        item.appendChild(channel)
        document.querySelectorAll(".channel-wrapper").forEach(y => {
          var identifier = y.parentNode.getAttribute("data-preload")
          var clone = item.cloneNode(true)
          if (identifier == "channels") {
            clone.onclick = z => {
              var disabled = z.currentTarget.getAttribute("data-disabled")
              if (!disabled) {
                var filter = document.querySelector('[data-window="channels"]').querySelector('[data-page="Filter"]')
                var disable = filter.querySelector(`[data-channel="${z.currentTarget.getAttribute("data-channel")}"][data-disabled]`)
                var active = z.currentTarget.classList.contains("channel-item-select")
                var select = document.querySelector(".channel-item-select")
                if (select) {
                  filter.querySelector(`[data-channel="${select.getAttribute("data-channel")}"]`).removeAttribute("data-disabled")
                  client.groups[client.focus].user.channel.select = 0
                  select.classList.remove("channel-item-select")
                  document.querySelector('[data-send="channels"]').removeAttribute("style")
                }
                if (!active) {
                  z.currentTarget.classList.add("channel-item-select")
                  document.querySelector('[data-send="channels"]').style.color = z.currentTarget.firstElementChild.style.background ? "#777": z.currentTarget.firstElementChild.style.backgroundColor
                  if (disable) {
                    disable.removeAttribute("data-disabled")
                  }
                  var opposite = filter.querySelector(`[data-channel="${clone.getAttribute("data-channel")}"]`)
                  opposite.setAttribute("data-disabled", true)
                  var revoke = opposite.classList.contains("channel-item-filter")
                  if (revoke) {
                    client.groups[client.focus].user.channel.filtered = client.groups[client.focus].user.channel.filtered.filter(a => a != clone.getAttribute("data-channel"))
                    opposite.classList.remove("channel-item-filter")
                    document.querySelector('[data-send="channels"]').removeAttribute("style")
                    document.querySelector(".application-chat-wrapper").querySelectorAll("[data-channel]").forEach(a => {
                      var filtered = a.getAttribute("data-channel").includes(`CHANNEL_${clone.getAttribute("data-channel").toUpperCase()}`)
                      if (filtered) {
                        a.parentNode.classList.remove("display-none")
                      }
                    })
                  }
                  var flag = z.currentTarget.getAttribute("data-flag")
                  if (flag) {
                    client.groups[client.focus].user.channel.select = parseInt(flag)
                  }
                }
              }
              if (client.settings.appearance.messages.preview_message) {
                client.setInput(client.groups[client.focus].user.input)
              }
            }
          } else {
            clone.onclick = z => {
              var disable = z.currentTarget.getAttribute("data-disabled")
              if (!disable) {
                var active = z.currentTarget.classList.contains("channel-item-filter")
                if (active) {
                  client.groups[client.focus].user.channel.filtered = client.groups[client.focus].user.channel.filtered.filter(a => a != z.currentTarget.getAttribute("data-channel"))
                  z.currentTarget.classList.remove("channel-item-filter")
                  document.querySelector(".application-chat-wrapper").querySelectorAll("[data-channel]").forEach(a => {
                    var filtered = a.getAttribute("data-channel").includes(`CHANNEL_${x.toUpperCase()}`)
                    if (filtered) {
                      a.parentNode.classList.remove("display-none")
                    }
                  })
                } else {
                  client.groups[client.focus].user.channel.filtered.push(z.currentTarget.getAttribute("data-channel"))
                  z.currentTarget.classList.add("channel-item-filter")
                  document.querySelector(".application-chat-wrapper").querySelectorAll("[data-channel]").forEach(a => {
                    var filtered = a.getAttribute("data-channel").includes(`CHANNEL_${x.toUpperCase()}`)
                    if (filtered) {
                      a.parentNode.classList.add("display-none")
                    }
                  })
                }
              }
              if (client.settings.appearance.messages.preview_message) {
                client.setInput(client.groups[client.focus].user.input)
              }
            }
          }
          if (identifier == "channels" && x != "no" || identifier == "filter") {
            y.appendChild(clone)
          }
        })
      }
    }
    document.querySelectorAll(".badge-item-wrapper").forEach(x => {
      x.onclick = y => {
        var disabled = y.currentTarget.getAttribute("disabled") || y.currentTarget.getAttribute("data-disabled")
        if (!disabled) {
          var active = y.currentTarget.classList.contains("badge-item-select")
          var select = x.parentNode.parentNode.querySelector(".badge-item-select")
          if (select) {
            select.classList.remove("badge-item-select")
            client.groups[client.focus].user.badge = 0
          }
          if (!active) {
            y.currentTarget.classList.add("badge-item-select")
            var flag = y.currentTarget.firstElementChild.getAttribute("data-flag")
            if (flag) {
              client.groups[client.focus].user.badge = parseInt(flag)
            }
          }
        }
        if (client.settings.appearance.messages.preview_message) {
          client.setInput(client.groups[client.focus].user.input)
        }
      }
    })
    var channels = document.querySelector('[data-preload="channels"]')
    channels.className = "chat-window-inside flex-direction-column"
    document.querySelector('[data-window="channels"]').querySelector('[data-page="Channels"]').appendChild(channels)
    var filter = document.querySelector('[data-preload="filter"]')
    filter.className = "chat-window-inside flex-direction-column"
    document.querySelector('[data-window="channels"]').querySelector('[data-page="Filter"]').appendChild(filter)
    var badges = document.querySelector('[data-preload="badges"]')
    badges.className = "chat-window-inside flex-direction-column"
    document.querySelector('[data-window="channels"]').querySelector('[data-page="Badges"]').appendChild(badges)
  }
}

document.querySelector('[data-send="fonts"]').onclick = () => {
  var preload = document.querySelector('[data-window="fonts"]')
  client.renderWindow({
    id: "fonts",
    title: "Fonts",
    icon: "font",
    width: "300px",
    height: "50vh",
    top: "22vh",
    left: "35vw",
    buttons: {
      Background: y => client.renderWindow({
        id: "fonts",
        title: "Background",
        icon: "fill-drip",
        page: y
      }),
      Theme: y => client.renderWindow({
        id: "fonts",
        title: "Theme",
        icon: "palette",
        page: y
      })
    },
    toggle: true,
    page: {
      fonts: false,
      background: false,
      theme: false
    }
  })
  if (!preload) {
    var fonts = document.querySelector('[data-preload="fonts"]')
    fonts.className = "chat-window-inside flex-direction-column"
    fonts.querySelector('[name="stylesOn"]').onchange = x => {
      client.user.style = x.currentTarget.checked
    }
    document.querySelector('[data-window="fonts"]').querySelector('[data-page="Fonts"]').appendChild(fonts)
    document.querySelector('[data-form="msgstyles"]').onsubmit = x => {
      x.preventDefault()
      fonts.querySelectorAll(".filter-button").forEach(x => {
        x.disabled = true
      })
      var time = client.focus == "private_message" ? chatango.server.time: client.groups[client.focus].room.time
      var form = new FormData(x.target)
      var entry = Object.fromEntries(form)
      form.set("hasrec", Date.now() + time)
      Array.from(["bold", "italics", "underline", "stylesOn"]).forEach(x => {
        form.set(x, entry[x] == "on")
      })
      Array.from(["nameColor", "textColor"]).forEach(x => {
        if (entry[x]) {
          form.set(x, entry[x].startsWith("#") ? entry[x].slice(1): entry[x])
        } else {
          form.set(x, "000000")
        }
      })
      form.set("usebackground", +client.user.background)
      client.post(chatango.path("updatemsgstyles"), form, {
        credential: "lo"
      }).then(async response => {
        console.log(response)
        client.groups[client.focus].socket.send("miu\r\n")
        fonts.querySelectorAll(".filter-button").forEach(x => {
          x.removeAttribute("disabled")
        })
      }).catch(error => {
        fonts.querySelectorAll(".filter-button").forEach(x => {
          x.removeAttribute("disabled")
        })
      })
    }

    var background = document.querySelector('[data-preload="background"]')
    background.className = "chat-window-inside flex-direction-column"
    background.querySelector('[name="usebackground"]').onchange = x => {
      client.user.background = !client.user.background
      client.socket(client.focus, `msgbg:${+client.user.background}`, "Could not toggle background.")
    }
    background.querySelector('[type="file"]').onchange = x => {
      background.querySelectorAll(".filter-button").forEach(x => {
        x.disabled = true
      })
      var form = new FormData()
      form.set("Filedata", x.currentTarget.files[0])
      client.post(chatango.path("updatemsgbg"), form, {
        progress: true,
        credential: "lo",
        status: {
          406: () => {
            client.setNotice({icon: "warning", color: "var(--theme-passive)", content: "Unsupported file format.", button: "Upload", action: () => background.querySelector('[name="usebackground"]').click()})
          }
        }
      }).then(async response => {
        console.log(response)
        if (response == "saved") {
          client.setNotice({icon: "check", color: "var(--theme-active)", content: "Background image successfully uploaded.", button: "Thanks"})
          background.querySelector('[name="useimg"]').checked = true
          var bgc = background.querySelector('[name="bgc"]').value
          var bgalp = background.querySelector('[name="bgalp"]').value
          var ialp = background.querySelector('[name="ialp"]').value
          background.querySelector(".background-item-preview").style.backgroundColor = hexToRgb(bgc, bgalp)
          var bgimg = document.createElement("img")
          bgimg.src = chatango.subdomain.msgbg(client.user.name, "jpg")
          bgimg.style.width = "100%"
          bgimg.style.opacity = ialp / 100
          background.querySelector(".background-item-preview").replaceChildren(bgimg)
          client.groups[client.focus].socket.send("miu\r\n")
        }
        background.querySelectorAll(".filter-button").forEach(x => {
          x.removeAttribute("disabled")
        })
        x.target.value = ""
      }).catch(error => {
        console.log(error)
        client.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: "An error occurred.", button: "Retry", action: () => document.querySelector('[data-form="msgbg"]').querySelector('[type="file"]').click()})
        background.querySelectorAll(".filter-button").forEach(x => {
          x.removeAttribute("disabled")
        })
        x.target.value = ""
      })
    }
    document.querySelector('[data-color="bgColor"]').addEventListener("input", x => {
      document.querySelector(".background-item-preview").style.background = x.target.value
    })

    document.querySelector('[data-window="fonts"]').querySelector('[data-page="Background"]').appendChild(background)
    document.querySelectorAll(".background-alignment-item").forEach(x => {
      x.onclick = () => {
        var select = document.querySelector(".background-alignment-select")
        if (select) {
          select.classList.remove("background-alignment-select")
        }
        x.classList.add("background-alignment-select")
      }
    })
    document.querySelector('[data-form="msgbg"]').onsubmit = x => {
      x.preventDefault()
      background.querySelectorAll(".filter-button").forEach(x => {
        x.disabled = true
      })
      var form = new FormData(x.target)
      var align = document.querySelector(".background-alignment-select")
      if (align) {
        form.set("align", align.getAttribute("data-align"))
      } else {
        form.set("align", "tl")
      }
      form.set("bgc", x.target.bgc.value.replace("#", ""))
      form.set("tile", +x.target.tile.checked)
      form.set("useimg", +x.target.useimg.checked)
      form.delete("usebackground")
      client.post(chatango.path("updatemsgbg"), form, {
        credential: "lo"
      }).then(async response => {
        console.log(response)
        document.querySelector('[data-form="msgstyles"]').querySelector('[type="submit"]').click()
        client.setNotice({enable: true, icon: "check", color: "var(--theme-active)", content: "pog", button: "Thanks"})
        background.querySelectorAll(".filter-button").forEach(x => {
          x.removeAttribute("disabled")
        })
      }).catch(error => {
        console.log(error)
        client.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: "An error occurred.", button: "Retry", action: () => document.querySelector('[data-form="msgbg"]').querySelector('[type="submit"]').click()})
        background.querySelectorAll(".filter-button").forEach(x => {
          x.removeAttribute("disabled")
        })
      })
    }

    var presets = document.querySelector('[data-preload="presets"]')
    presets.className = "chat-window-inside flex-direction-column"
    document.querySelector('[data-window="fonts"]').querySelector('[data-page="Theme"]').appendChild(presets)
  }
}

document.querySelector('[data-send="emojis"]').onclick = () => {
  var preload = document.querySelector('[data-window="emojis"]')
  client.renderWindow({
    id: "emojis",
    title: "Emojis",
    icon: "face-grin-wide",
    width: "59vw",
    height: "80vh",
    top: "10vh",
    left: "20vw",
    buttons: {
      Media: y => client.renderWindow({
        id: "emojis",
        title: "Media",
        icon: "images",
        page: y
      })
    },
    toggle: true,
    page: {
      emojis: false,
      media: false
    }
  })
  if (!preload) {
    var emoji = document.querySelector('[data-preload="emoji"]')
    emoji.className = "chat-window-inside flex-direction-column"
    document.querySelector('[data-preload="emojis"]').querySelectorAll("svg").forEach(x => {
      var emoji = x.cloneNode(true)
      emoji.querySelectorAll("[id]").forEach(y => {
        var previous = y.getAttribute("id")
        var identifier = `e${Math.floor(Math.random() * 1E16)}`
        y.setAttribute("id", identifier)
        var overwrite = y.parentNode.parentNode.querySelector(`[fill="url(#${previous})"]`) || y.parentNode.parentNode.querySelector(`[stroke="url(#${previous})"]`)
        overwrite.setAttribute("fill", `url(#${identifier})`)
      })
      var alias = x.classList[0].split("-")[2]
      var entity = x.getAttribute("data-entity")
      var premium = x.getAttribute("data-premium")
      var item = document.createElement("div")
      item.className = "emoji-item"
      item.setAttribute("data-emoji", alias)
      item.setAttribute("data-entity", entity)
      if (premium) {
        item.setAttribute("data-premium", true)
      }
      item.onclick = y => {
        var recent = document.querySelector('[data-preload="emoji"]').querySelector('[data-index="emojis"]')
        var exist = recent.querySelector(`[data-entity="${y.currentTarget.getAttribute("data-entity")}"]`)
        if (!exist) {
          var secondary = item.cloneNode(true)
          secondary.onclick = z => {
            var select = z.currentTarget.getAttribute("data-entity").split(" ")[0]
            var scale = document.querySelector('[data-input="emojiScale"]').firstElementChild.value
            var parameter = select.includes("*?") ? select.replace("*?", `*+${scale}?`): select + `+${scale}`
            if (scale == 0) {
              client.setPlaceholder({append: `&nbsp;${select}&nbsp;`, focus: true})
            } else {
              client.setPlaceholder({append: `&nbsp;${parameter}&nbsp;`, focus: true})
            }
          }
          recent.appendChild(secondary)
        }
        var select = y.currentTarget.getAttribute("data-entity").split(" ")[0]
        var scale = document.querySelector('[data-input="emojiScale"]').firstElementChild.value
        var parameter = select.includes("*?") ? select.replace("*?", `*+${scale}?`): select + `+${scale}`
        if (scale == 0) {
          client.setPlaceholder({append: `&nbsp;${select}&nbsp;`, focus: true})
        } else {
          client.setPlaceholder({append: `&nbsp;${parameter}&nbsp;`, focus: true})
        }
      }
      emoji.style.width = "100%"
      emoji.style.height = "100%"
      item.appendChild(emoji)
      document.querySelector(premium ? '[data-emoji="premium"]': '[data-emoji="classic"]').appendChild(item)
    })
    document.querySelector('[data-window="emojis"]').querySelector('[data-page="Emojis"]').appendChild(emoji)
    var media = document.querySelector('[data-preload="media"]')
    media.className = "chat-window-inside flex-direction-column"
    document.querySelector('[data-window="emojis"]').querySelector('[data-page="Media"]').appendChild(media)
  }
}

document.querySelector('[data-advanced="media"]').onclick = x => {
  filterModal({
    id: "media",
    title: "Filter media",
    icon: "fa-images",
    toggles: {
      "Images": {
        id: "img",
        on: true
      },
      "GIFs": {
        id: "gif",
        on: true
      },
      "Audios": {
        id: "mp3",
        on: true
      },
      "Videos": {
        id: "mp4",
        on: true
      }
    }
  })
  document.querySelector(".filter").classList.add("filter-view")
  document.querySelector(".filter-items").focus()
}

document.querySelector('[data-preload="media"] [data-button="uploaded"]').onclick = x => {
  var select = document.querySelector(".media-tab-select")
  if (select) {
    select.classList.remove("media-tab-select")
  }
  x.currentTarget.classList.add("media-tab-select")
  document.querySelector('[data-form="imagescan"]').classList.remove("display-none")
  document.querySelector('[data-form="searchmedia"]').classList.add("display-none")
  document.querySelector('[data-index="scan"]').classList.remove("display-none")
  document.querySelector('[data-index="media"]').classList.add("display-none")
  document.querySelector('[data-window="emojis"] .chat-window-content').onscroll = null
}

document.querySelector('[data-preload="media"] [data-button="favorited"]').onclick = x => {
  var select = document.querySelector(".media-tab-select")
  if (select) {
    select.classList.remove("media-tab-select")
  }
  x.currentTarget.classList.add("media-tab-select")
  document.querySelector('[data-form="imagescan"]').classList.add("display-none")
  document.querySelector('[data-form="searchmedia"]').classList.remove("display-none")
  document.querySelector('[data-index="scan"]').classList.add("display-none")
  document.querySelector('[data-index="media"]').classList.remove("display-none")
  document.querySelector('[data-window="emojis"] .chat-window-content').onscroll = x => {
    var top = x.currentTarget.scrollHeight - x.currentTarget.scrollTop - x.currentTarget.clientHeight
    if (!client.cache.media.load && top <= 1) {
      var key = document.querySelector('[data-index="media"]').querySelectorAll("img")
      var last = Array.from(key).slice(-1)[0]
      client.loadMedia({key: last.src})
    }
  }
}

document.querySelector('[data-preload="media"] [data-button="view"]').onclick = x => {
  var images = document.querySelectorAll('[data-preload="media"] [data-index]:not(.display-none) img, [data-preload="media"] [data-index]:not(.display-none) canvas')
  var source = Array.from(images).map(x => x.getAttribute("data-src"))
  var proxied = Array.from(images).map(x => x.getAttribute("src"))
  client.externalWarning({url: proxied[0], urls: proxied, source: source, type: "image"})
}

document.querySelector('[data-upload="importMedia"]').onchange = x => {
  client.importMedia(x)
}

document.querySelector('[data-preload="media"] [data-button="import"]').onclick = x => {
  document.querySelector('[data-upload="importMedia"]').click()
}

document.querySelector('[data-preload="media"] [data-button="export"]').onclick = x => {
  client.exportMedia()
}

document.querySelector('[data-form="imagescan"]').onsubmit = x => {
  x.preventDefault()
  var form = new FormData(x.target)
  var data = Object.fromEntries(form)
  chatango.renderImage(data.username, data.start, data.stop)
}

/* APPLICATION WINDOW FONT FUNCTIONS */

document.querySelectorAll("[data-color]").forEach(x => {
  var item = x.getAttribute("data-color")
  x.oninput = y => {
    document.querySelector(`[data-color-input="${item}"]`).value = y.currentTarget.value
    document.querySelector(`[data-color-input="${item}"]`).style.color = y.currentTarget.value
    //document.querySelector(`[data-color-input="${item}"]`).nextElementSibling.style.backgroundColor = y.currentTarget.value
  }
  document.querySelector(`[data-color-input="${item}"]`).oninput = y => {
    var value = y.currentTarget.value
    var hashtag = value.startsWith("#")
    if (!hashtag) {
      value = "#" + value
    }
    var hexadecimal = value.match(/(#[a-f0-9]{6})/i)
    if (hexadecimal) {
      y.currentTarget.value = hexadecimal[0]
      document.querySelector(`[data-color="${item}"]`).value = hexadecimal[0]
      document.querySelector(`[data-color-input="${item}"]`).style.color = hexadecimal[0]
    }
  }
})

/* APPLICATION WINDOW GROUP FUNCTIONS */

document.querySelector('[data-text-field="groups"]').oninput = x => {
  var value = x.currentTarget.value.toLowerCase()
  document.querySelectorAll(".group-index-item").forEach(y => {
    if (y.getAttribute("data-group").indexOf(value) >= 0) {
      y.removeAttribute("style")
    } else {
      y.style.display = "none"
    }
  })
  Array.from(["favorited", "recent", "own"]).forEach(y => {
    if (Array.from(x.currentTarget.parentNode.parentNode.parentNode.querySelector(`[data-index="${y}"]`).children).filter(z => z.style.display != "none").length == 1) {
      document.querySelector(`[data-empty="group${y[0].toUpperCase() + y.slice(1)}"]`).style.display = "block"
    } else {
      document.querySelector(`[data-empty="group${y[0].toUpperCase() + y.slice(1)}"]`).removeAttribute("style")
    }
  })
}

/* APPLICATION WINDOW EMOJI FUNCTIONS */

document.querySelector('[data-text-field="emojis"]').oninput = x => {
  var value = x.currentTarget.value.toLowerCase()
  document.querySelectorAll(".emoji-item").forEach(y => {
    if (y.getAttribute("data-entity").includes(value) || y.getAttribute("data-emoji").indexOf(value) >= 0) {
      y.removeAttribute("style")
    } else {
      y.style.display = "none"
    }
  })
  if (Array.from(document.querySelector('[data-index="emojis"]').children).filter(x => x.style.display != "none").length == 1) {
    document.querySelector('[data-empty="emojiRecent"]').style.display = "block"
  } else {
    document.querySelector('[data-empty="emojiRecent"]').removeAttribute("style")
  }
  if (Array.from(document.querySelector('[data-emoji="classic"]').children).filter(x => x.style.display != "none").length == 1) {
    document.querySelector('[data-empty="emojiClassic"]').style.display = "block"
  } else {
    document.querySelector('[data-empty="emojiClassic"]').removeAttribute("style")
  }
  if (Array.from(document.querySelector('[data-emoji="premium"]').children).filter(x => x.style.display != "none").length == 1) {
    document.querySelector('[data-empty="emojiPremium"]').style.display = "block"
  } else {
    document.querySelector('[data-empty="emojiPremium"]').removeAttribute("style")
  }
}

/* UNIVERSAL UTILITY */

function pythonRange(start, stop, step) {
  var result = []
  if (!stop) {
    stop = start
    start = 0
  }
  if (!step) {step = 1}
  if (step > 0 && start >= stop || step < 0 && start <= stop) {return []}
  for (var x = start; step > 0 ? x < stop : x > stop; x+= step) {result.push(x)}
  return result
}

function fontScale(data) {
  var resize = data *= 100 / 11
  200 < resize && (resize = 200) || 82 > resize && (resize = 82)
  return `${Math.round(resize)}%`
}

function hexToRgb(data, alpha) {
  var hex = data.toLowerCase().match(/([a-f\d]{2})/gi).map(x => {return parseInt(x, 16)})
  if (alpha) {
    var a = alpha / 100
    var convert = hex.map(x => {
      var transparent = x * a + 255 * (1 - a)
      return Math.round(transparent)
    })
    var value = convert.map(x => {return 1 == x.toString(16).length ? "0" + x.toString(16): x.toString(16)})
    var redo = value.join("").toLowerCase().match(/([a-f\d]{2})/gi).map(x => {return parseInt(x, 16)})
    return hex ? `rgb(${redo.join(", ")})`: "var(--theme-text-title)"
  } else {return hex ? `rgb(${hex.join(", ")})`: "var(--theme-text-title)"}
}

function hexExtend(data) {
  var value = data.startsWith("#") ? data.slice(1).toLowerCase(): data.toLowerCase()
  if (value.length == 3) {return value.split("").map(x => x + x).join("")}
  else if (value.length == 6) {return value}
  else {return "000000"}
}

function hexBrightness(data, query) {
  var value = hexExtend(data)
  var rgb = parseInt(value, 16)
  var r = (rgb >> 16) & 255
  var g = (rgb >> 8) & 255
  var b = (rgb >> 0) & 255
  var lumen = (r + g + b) / 3
  var contrast = document.body.getAttribute("data-theme") || "dark"
  if (client.settings.appearance.messages.adjust_color) {
    if (lumen <= 76 && contrast == "dark") {return query}
    else if (lumen >= 128 && contrast == "light") {return query}
  }
  return "#" + value
}

const mdParseTag = (tagName, children, attributes = {}) =>
  `<${tagName}${Object.entries(attributes)
    .map(([k, v]) => (v ? ` ${k}="${encode(v)}"` : ""))
    .join("")}>${children}</${tagName}>`

const mdParseRule = (text, rules, parse) => {
  for (let i = 0; i < rules.length; i += 2) {
    const match = rules[i].exec(text)

    if (match) {
      const [matched, ...rest] = match;

      return (
        parse(text.slice(0, match.index)) +
        (typeof rules[i + 1] === "string"
          ? rules[i + 1].replace(/\$(\d)/g, (_, d) => rest[d - 1])
          : rules[i + 1].apply(null, match)) +
        parse(text.slice(match.index + matched.length))
      )
    }
  }

  return text
}

const mdParseStyle = text => mdParseRule(
  text,
  [
    /\\([\\*_])/,
    (match, char) => char,

    /(?![^<]*>)(https?:\/\/[^<\s]+\.(?:[a-z])[^<"`\s]*|www\..*?[^<"`\s]+\.(?:[a-z])[^<"`\s]*)/,
    (match, char) => char,

    /([*_]{1,3})((.)+?)\1/,
    (match, k, text) => {
      const len = k.length

      //if (k[0] === "*" && text === "*") return match

      text = mdParseStyle(text)

      if (k[0] == "_") {
        if (len == 1) return mdParseTag("i", text)
        if (len == 2) return mdParseTag("u", text)
        if (len == 3) return mdParseTag("i", mdParseTag("u", text))
      }

      if (k[0] == "*") {
        if (len == 1) return mdParseTag("i", text)
        if (len == 2) return mdParseTag("b", text)
        if (len == 3) return mdParseTag("b", mdParseTag("i", text))
      }
      return text
    }
  ],
  mdParseStyle
)

document.body.onkeyup = x => {
  if (x.code == "Escape") {
    var view = document.querySelector(".filter").classList.contains("filter-view")
    document.querySelector(".filter").classList.remove("filter-view")
  }
}

document.querySelector(".filter").onclick = x => {
  var view = x.target.classList.contains("filter-view")
  if (view) {
    document.querySelector(".filter").classList.remove("filter-view")
  }
}

function filterModal(data) {
  var filter = document.querySelector(".filter").getAttribute("data-filter")
  if (filter != data.id) {
    document.querySelector(".filter").setAttribute("data-filter", data.id)
    document.querySelector(".filter-header-title").textContent = data.title
    document.querySelector(".filter-icon").className = `filter-icon fa-solid ${data.icon}`
    var items = []
    Object.keys(data.toggles).forEach(x => {
      var item = document.createElement("div")
      item.className = "ease-item"
      var label = document.createElement("span")
      label.className = "ease-label"
      label.textContent = x.replace(/_/g, " ")
      item.appendChild(label)
      var toggle = document.createElement("label")
      toggle.className = "switch-toggle"
      var check = document.createElement("input")
      check.type = "checkbox"
      if (data.toggles[x].on) {
        check.checked = true
      }
      /*
      check.onchange = y => {
        data.toggles[x].toggle(y.currentTarget, y.currentTarget.checked)
      }
      */
      check.setAttribute("data-filter-id", data.toggles[x].id)
      toggle.appendChild(check)
      var circle = document.createElement("span")
      circle.className = "ease-switch toggle-switch"
      toggle.appendChild(circle)
      item.appendChild(toggle)
      items.push(item)
    })
    document.querySelector(".filter-items").replaceChildren(...items)
  }
}

document.querySelectorAll(".input-cancel").forEach(x => {
  x.onclick = () => {
    var disabled = x.previousElementSibling.getAttribute("disabled")
    if (!disabled) {
      var event = new Event("input")
      x.previousElementSibling.value = ""
      x.previousElementSibling.focus()
      x.previousElementSibling.dispatchEvent(event)
    }
  }
})

document.querySelector(".sidebar-meet-sort").onchange = x => {
  var target = document.querySelectorAll(".application-chat-meet .application-profile-container")
  if (x.target.value == 2) {
    var order = Array.from(target).sort((a, b) => {
      return a.getAttribute("data-user").localeCompare(b.getAttribute("data-user"))
    })
    order.forEach(y => {
      document.querySelector(".application-chat-meet").appendChild(y)
    })
  } else if (x.target.value == 3) {
    var order = Array.from(target).sort((a, b) => {
      return a.getAttribute("data-user").length - b.getAttribute("data-user").length
    })
    order.forEach(y => {
      document.querySelector(".application-chat-meet").appendChild(y)
    })
  }
}

document.querySelector(".sidebar-meet-order").onclick = x => {
  var opposite = x.currentTarget.getAttribute("title")
  if (opposite == "Ascending") {
    x.currentTarget.className = "sidebar-sort-order fa-solid fa-arrow-down-wide-short"
    x.currentTarget.setAttribute("title", "Descending")
  } else {
    x.currentTarget.className = "sidebar-sort-order fa-solid fa-arrow-up-short-wide"
    x.currentTarget.setAttribute("title", "Ascending")
  }
  var target = document.querySelectorAll(".application-chat-meet .application-profile-container")
  var order = Array.from(target).reverse()
  order.forEach(y => {
    y.parentNode.appendChild(y)
  })
}

document.querySelectorAll(".sidebar-sort-item:not(.sidebar-meet-sort)").forEach(x => {
  var parent = x.parentNode.parentNode.parentNode.getAttribute("data-people")
  x.onchange = y => {
    var target = document.querySelector(`.sidebar-people[data-people="${parent}"]`).querySelectorAll(".sidebar-user-item, .application-profile-container")
    if (y.target.value == 2) {
      var order = Array.from(target).sort((a, b) => {
        return a.textContent.localeCompare(b.textContent)
      })
      order.forEach(z => {
        z.parentNode.appendChild(z)
      })
    } else if (y.target.value == 3) {
      var order = Array.from(target).sort((a, b) => {
        var second = b.getAttribute("data-timestamp")
        if (a.getAttribute("data-timestamp") && second) {
          return a.getAttribute("data-timestamp").localeCompare(second)
        }
      })
      order.forEach(z => {
        z.parentNode.appendChild(z)
      })
    } else if (y.target.value == 4) {
      var order = Array.from(target).sort((a, b) => {
        return a.textContent.length - b.textContent.length
      })
      order.forEach(z => {
        z.parentNode.appendChild(z)
      })
    } else if (y.target.value == 5) {
      var order = Array.from(target).sort((a, b) => {
        var second = b.getAttribute("data-lastmsg")
        if (a.getAttribute("data-lastmsg") && second) {
          return a.getAttribute("data-lastmsg").localeCompare(second)
        }
      })
      order.forEach(z => {
        z.parentNode.appendChild(z)
      })
    }
  }
})

document.querySelectorAll(".sidebar-sort-order:not(.sidebar-meet-order)").forEach(x => {
  var parent = x.parentNode.parentNode.parentNode.getAttribute("data-people")
  x.onclick = () => {
    var opposite = x.getAttribute("title")
    if (opposite == "Ascending") {
      x.className = "sidebar-sort-order fa-solid fa-arrow-down-wide-short"
      x.setAttribute("title", "Descending")
    } else {
      x.className = "sidebar-sort-order fa-solid fa-arrow-up-short-wide"
      x.setAttribute("title", "Ascending")
    }
    var target = document.querySelector(`.sidebar-people[data-people="${parent}"]`).querySelectorAll(".sidebar-user-item, .application-profile-container")
    var order = Array.from(target).reverse()
    order.forEach(y => {
      y.parentNode.appendChild(y)
    })
  }
})

document.querySelectorAll("[data-copy]").forEach(x => {
  x.onclick = y => {
    var text = y.currentTarget.parentNode.firstElementChild
    text.select()
    navigator.clipboard.writeText(text.value)
  }
})

document.querySelectorAll(".input-unhide").forEach(x => {
  x.onclick = () => {
    x.className = x.previousElementSibling.type == "text" ? x.className.replace("fa-eye-slash", "fa-eye"): x.className.replace("fa-eye", "fa-eye-slash")
    x.previousElementSibling.type = x.previousElementSibling.type == "text" ? "password": "text"
  }
})

Array.from([false, "annc"]).forEach(x => {
  var faceAttribute = document.querySelector(`.${x ? x + "-font-face": "font-face"}`).parentNode.getAttribute("for")
  var face = document.createElement("select")
  face.className = (x ? x + "-font-face": "font-face") + " text-input"
  if (faceAttribute) {
    face.setAttribute("name", faceAttribute)
  }
  for (var y in chatango.fonts.face) {
    var family = document.createElement("option")
    family.value = y
    family.textContent = chatango.fonts.face[y][0].toUpperCase() + chatango.fonts.face[y].slice(1)
    family.style.fontFamily = chatango.fonts.family[y]
    face.appendChild(family)
  }
  document.querySelector(`.${x ? x + "-font-face": "font-face"}`).appendChild(face)
  var sizeAttribute = document.querySelector(`.${x ? x + "-font-size": "font-size"}`).parentNode.getAttribute("for")
  var size = document.createElement("select")
  size.className = (x ? x + "-font-size": "font-size") + " text-input"
  if (sizeAttribute) {
    size.setAttribute("name", sizeAttribute)
  }
  pythonRange(9, 23).forEach(y => {
    var percent = document.createElement("option")
    percent.value = y
    percent.textContent = y
    if (y == 11) {
      percent.defaultSelected = true
    }
    percent.style.fontSize = fontScale(y)
    size.appendChild(percent)
  })
  document.querySelector(`.${x ? x + "-font-size": "font-size"}`).appendChild(size)
})

document.querySelector('[data-preload="emojis"]').querySelectorAll("svg").forEach(x => {
  var alias = x.classList[0].split("-")[2]
  var entity = x.getAttribute("data-entity").split(" ").forEach(y => {
    var icon = y.split("?")[0]
    chatango.emojis[icon] = alias
  })
})

Object.keys(localStorage).forEach(x => {
  var theme = x.startsWith("custom-theme")
  if (theme) {
    var edit = localStorage.getItem(x)
    var source = JSON.parse(edit)
    var arrange = {
      text: {
        1: false,
        2: false
      },
      compliment: {
        1: false,
        2: false
      }
    }
    for (var y in source) {
      if (y == "text-title") {arrange.text[1] = source[y]}
      else if (y == "text-description") {arrange.text[2] = source[y]}
      else if (y == "highlight") {arrange.compliment[1] = source[y]}
      else if (y == "passive") {arrange.compliment[2] = source[y]}
      else {arrange[y] = source[y]}
    }
    applyTheme(arrange)
  }
})

document.querySelectorAll(".modal-close-icon").forEach(x => {
  var item = x.getAttribute("data-close")
  x.onclick = () => {
    if (item) {
      document.querySelector(`[data-modal="${item}"]`).classList.remove("modal-view")
      var notice = document.querySelector(".application-notice")
      document.querySelector(".application-content").prepend(notice)
    } else {
      var external = document.querySelector(".external-modal").getAttribute("data-external")
      client.externalWarning({close: true, type: external})
    }
  }
})

document.querySelector(".external-modal").onmouseup = x => {
  if (x.target == x.currentTarget) {
    var external = x.currentTarget.getAttribute("data-external")
    document.querySelector(".external-modal-profile").replaceChildren()
    if (external) {
      client.externalWarning({close: true, type: external})
    } else {
      client.externalWarning({close: true, overwrite: true})
    }
  }
}

document.querySelector(".external-modal-media").onclick = x => {
  if (x.target == x.currentTarget) {
    var external = document.querySelector(".external-modal").getAttribute("data-external")
    document.querySelector(".external-modal-profile").replaceChildren()
    if (external) {
      client.externalWarning({close: true, type: external})
    } else {
      client.externalWarning({close: true, overwrite: true})
    }
  }
}

document.querySelector(".external-image-cycle:first-child").onclick = () => {
  var begin = document.querySelector(".external-image-wrapper").querySelector(".display-block")
  if (begin) {
    begin.classList.remove("display-block")
    if (begin.previousElementSibling) {
      begin.previousElementSibling.classList.add("display-block")
    } else {
      document.querySelector(".external-image-wrapper").lastElementChild.classList.add("display-block")
    }
  }
}

document.querySelector(".external-image-cycle:last-child").onclick = () => {
  var begin = document.querySelector(".external-image-wrapper").querySelector(".display-block")
  if (begin) {
    begin.classList.remove("display-block")
    if (begin.nextElementSibling) {
      if (begin.nextElementSibling.tagName != "SPAN") {
        begin.nextElementSibling.classList.add("display-block")
      } else {
        document.querySelector(".external-image-wrapper").firstElementChild.classList.add("display-block")
      }
    } else {
      document.querySelector(".external-image-wrapper").firstElementChild.classList.add("display-block")
    }
  }
}

document.querySelectorAll('[data-advanced="currency"]').forEach(x => {
  x.onchange = y => {
    y.currentTarget.parentNode.previousElementSibling.className = `field-icon fa-solid fa-${y.currentTarget.value}-sign`
  }
})

document.querySelector(".chat-more-icon").onclick = x => {
  client.setContext(x.currentTarget, {action: ["upload", "command"], height: true, top: -14, left: 10, toggle: true})
}

document.querySelector(".chat-more-icon").onkeyup = x => {
  if (x.code == "Space") {
    x.currentTarget.click()
  }
}

client.setMessage(document.querySelector(".chat-send-message"))

async function mascot() {
  if (!client.mascot) {
    var blob = await fetch(`${torch.static}/img/mascot.gif`).then(x => x.blob())
    var data = await new Promise(resolve => {
      var read = new FileReader()
      read.onload = () => resolve(read.result)
      read.readAsDataURL(blob)
    })
    client.mascot = data
    var greet = document.querySelector(".client-greet")
    if (greet) {
      var cute = document.createElement("img")
      cute.src = data
      cute.alt = "Client mascot"
      cute.className = "client-mascot"
      cute.style.display = "none"
      cute.setAttribute("data-pet", 0)
      cute.ondragstart = x => {
        x.currentTarget.classList.remove("client-mascot-harass")
        return false
      }
      cute.onmousedown = x => {
        x.currentTarget.classList.add("client-mascot-harass")
      }
      cute.onmouseup = x => {
        x.currentTarget.classList.remove("client-mascot-harass")
      }
      cute.onclick = x => {
        var pet = x.currentTarget.getAttribute("data-pet")
        x.currentTarget.classList.add("client-mascot-abuse")
        setTimeout(() => {
          document.querySelector(".client-mascot").classList.remove("client-mascot-abuse")
        }, 50)
        if (pet != 0 && pet % 10 == 0) {
          x.currentTarget.parentNode.classList.add("client-mascot-scared")
          setTimeout(() => {
            document.querySelector(".client-greet").classList.remove("client-mascot-scared")
          }, 3000)
        }
        x.currentTarget.setAttribute("data-pet", parseInt(pet) + 1)
      }
      greet.appendChild(cute)
      document.querySelector(".client-logo-fire").onclick = () => {
        document.querySelector(".client-mascot").style.display = "block"
        document.querySelector(".client-greet").classList.toggle("client-mascot-hide")
      }
    }
  }
  window.onpopstate = x => {
    var previous = client.previous
    client.previous = x.state ? x.state.name: "home"
    if (x.state.name == "setFocus") {
      client.setFocus({group: x.state.group, reload: true})
    } else {
      var leave = document.querySelector(`[data-close="${x.state.name}"]`)
      if (leave) {
        leave.click()
      }
    }
  }
  window.onresize = function() {
    var width = window.outerWidth - window.innerWidth > 100
    var height = window.outerHeight - window.innerHeight > 100
    var cooldown = Date.now() - client.cache.cooldown.console
    if (Date.now() > client.cache.cooldown.console) {
      if (width || height) {
        client.cache.cooldown.console = Date.now() + 5000
        var greeting = `color: #0084ef; padding: 64px; font-size: 20px; background: url(${client.mascot}) no-repeat;`
        var warning = "color: #febc2c; font-size: 16px;"
        var danger = "color: #fd413c; font-size: 16px;"
        var fun = "color: #3ba55d; font-size: 14px;"
        console.log("%c       Greetings!", greeting)
        console.log(
          "%cIf somebody asks you to copy or paste something here, don't do it!\n" +
          "%cIt could lead to your account being compromised, or worse!\n" +
          "%cIf you understand what you are doing, good job! owo",
          warning, danger, fun
        )
      }
    }
  }
  window.ononline = x => {
    client.setConnect({icon: "spinner", content: "Connecting..."})
  }
  window.onoffline = x => {
    for (let x in client.groups) {
      clearInterval(client.groups[x].ping)
    }
    client.setConnect({enable: true, icon: "plug-circle-xmark", color: "var(--theme-highlight)", content: "You are offline.", confirm: "Check your connection!",
      action: {
        retry: () => {
          client.setConnect({enable: true, icon: "spinner", color: "var(--theme-passive)", animation: "rotation 1.5s linear infinite", content: "Reconnecting..."})
        },
        close: () => {
          client.setConnect({icon: "spinner", content: "Connecting..."})
        }
      }
    })
  }
  window.onmessage = x => {
    if (x.origin == torch.origin) {
      if (x.data.action) {
        switch (x.data.action) {
          case "log":
            var iframe = document.querySelector(".application-content iframe")
            if (iframe && iframe.classList.contains("display-none")) {
              document.querySelector('[data-sidebar="track"]').classList.add("application-icon-mention")
            }
            break;
          case "profile":
            document.querySelector('[data-sidebar="user"]').click()
            setTimeout(() => {
              document.querySelector('[data-content="profile"] .window-inside-button').scrollIntoView({behavior: "smooth", block: "center"})
              setTimeout(() => {
                document.querySelector('[data-content="profile"] .filter-apply').click()
              }, 500)
            }, 500)
            break;
        }
      }
    }
  }
}

mascot()

document.querySelector('[data-advanced="ban"]').onclick = x => {
  filterModal({
    id: "bans",
    title: "Filter bans",
    icon: "fa-gavel",
    toggles: {
      Guests: {
        id: "guests"
      }
    }
  })
  document.querySelector(".filter").classList.add("filter-view")
  document.querySelector(".filter-items").focus()
  document.querySelector(".filter-apply").onclick = () => {
    document.querySelector(".filter").classList.remove("filter-view")
    Array.from(document.querySelector(".filter-items").children).forEach(y => {
      var category = y.querySelector("input").getAttribute("data-filter-id")
      if (category == "guests") {
        client.groups[client.focus].socket.send(`blocklist:block:0:next:50:anons:${y.querySelector("input").checked ? 1: 0}\r\n`)
      }
    })
  }
  if (x.currentTarget.getAttribute("data-filter-first") != 1) {
    x.target.setAttribute("data-filter-first", 1)
    var reset = Array.from(document.querySelector(".filter-items").cloneNode(true).children).map(y => y.querySelector("input").checked)
    document.querySelector(".filter-reset").onclick = () => {
      document.querySelector(".filter-items").focus()
      Array.from(document.querySelector(".filter-items").children).forEach((y, z) => {
        if (y.querySelector("input").checked != reset[z]) {
          y.querySelector("input").click()
        }
      })
    }
  }
}

document.querySelector('[data-advanced="unban"]').onclick = x => {
  filterModal({
    id: "unbans",
    title: "Filter unbans",
    icon: "fa-ban",
    toggles: {
      Guests: {
        id: "guests"
      }
    }
  })
  document.querySelector(".filter").classList.add("filter-view")
  document.querySelector(".filter-items").focus()
  document.querySelector(".filter-apply").onclick = () => {
    document.querySelector(".filter").classList.remove("filter-view")
    Array.from(document.querySelector(".filter-items").children).forEach(y => {
      var category = y.querySelector("input").getAttribute("data-filter-id")
      if (category == "guests") {
        client.groups[client.focus].socket.send(`blocklist:unblock:0:next:50:anons:${y.querySelector("input").checked ? 1: 0}\r\n`)
      }
    })
  }
  if (x.currentTarget.getAttribute("data-filter-first") != 1) {
    x.target.setAttribute("data-filter-first", 1)
    var reset = Array.from(document.querySelector(".filter-items").cloneNode(true).children).map(y => y.querySelector("input").checked)
    document.querySelector(".filter-reset").onclick = () => {
      document.querySelector(".filter-items").focus()
      Array.from(document.querySelector(".filter-items").children).forEach((y, z) => {
        if (y.querySelector("input").checked != reset[z]) {
          y.querySelector("input").click()
        }
      })
    }
  }
}

function toggleDevMode() {
  document.querySelectorAll('[data-tag="UNIMPLEMENTED"]').forEach(x => {
    x.classList.toggle("display-none")
  })
  //client.groups[client.focus].socket.send("blocklist:block:0:next:50:anons:1\r\n")
  document.querySelector('[data-sidebar="purchase"]').onclick = () => {
    client.externalWarning({url: chatango.path("submit", "secure"), type: "purchase"})
  }
  /*
  var lang = document.createElement("span")
  lang.textContent = i18next.t("test", "Testing language!")
  document.querySelector('[data-window="uploadtest"]').querySelector('[data-page="Yep"]').appendChild(lang)
  */
}

document.querySelector('[data-setting="mode_developer"]').onchange = () => {
  toggleDevMode()
}

const module = {}

const plugins = {
  "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/2.0.0-alpha.2/cropper.min.js": {
    sha: "sha512-IlZV3863HqEgMeFLVllRjbNOoh8uVj0kgx0aYxgt4rdBABTZCl/h5MfshHD9BrnVs6Rs9yNN7kUQpzhcLkNmHw==",
    load: () => {
      console.log("Loaded plugin: cropperjs v2.0.0-beta.3")
    },
    error: () => {
      console.log("Plugin cropperjs failed to load")
    }
  },
  "https://cdnjs.cloudflare.com/ajax/libs/punycode/2.3.0/punycode.min.js": {
    sha: "sha512-DMxyecgBKZK+k2joQ1F3ok3kIeVjKbhJZjKc+XPSZpkiRDEf7GdwckDwxP71UDZeTubh3K6Fh3pFWE1TLW44/A==",
    load: () => {
      console.log("Loaded plugin: punycodejs v2.3.0")
    },
    error: () => {
      console.log("Plugin punycodejs failed to load")
    }
  },
  "https://cdnjs.cloudflare.com/ajax/libs/i18next-http-backend/2.2.0/i18nextHttpBackend.min.js": {
    sha: "sha512-WlAzwRZ9dGOdaPGOnIqwZ7mZK3YPu+uvA3gw5JiO+9OzQlIk7cXF9BCYasw79ScmRHeO4bfeAlovLwZ3I6uSGg==",
    load: () => {
      console.log("Loaded plugin: i18n-http-backend v2.0.0")
      var script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/i18next/22.4.15/i18next.min.js"
      script.integrity = "sha512-fDt50cr//jIKim9lb8ly/E4obyrGx7hIK0irvSAg0X7awULsliT1Q8GYVqkfeovyWX3arQoLn6MOmjNKqD8MZA=="
      script.crossOrigin = "anonymous"
      script.referrerPolicy = "no-referrer"
      script.onload = () => {
        console.log("Loaded plugin: i18n v22.4.15")
        i18next.use(i18nextHttpBackend).init({
          debug: true,
          lng: navigator.language,
          fallbackLng: "en-US",
          backend: {
            loadPath: `${torch.static}/locale/client/${navigator.language}.json`
          }
        }, () => {
          document.querySelectorAll(".i18n").forEach(x => {
            var path = x.getAttribute("data-i18n")
            var attribute = x.getAttribute("data-attribute")
            if (attribute) {
              x.setAttribute(attribute, i18next.t(path, attribute))
            } else {
              var context = x.getAttribute("data-context") || "textContent"
              x[context] = i18next.t(path, x[context])
            }
          })
        })
      }
      script.onerror = () => {
        console.log("Plugin i18next failed to load")
      }
      document.body.appendChild(script)
    },
    error: () => {
      console.log("Plugin i18n-http-backend failed to load")
    }
  }
}
for (x in plugins) {
  var script = document.createElement("script")
  script.src = x
  script.integrity = plugins[x].sha
  script.crossOrigin = "anonymous"
  script.referrerPolicy = "no-referrer"
  script.onload = plugins[x].load
  script.onerror = plugins[x].error
  document.body.appendChild(script)
}

//cat alpha.js | openssl dgst -sha512 -binary | openssl base64 -A

document.body.removeAttribute("style")