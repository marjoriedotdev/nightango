(x => {
  // Check if page is https://st.chatango.com
  var domain = x.startsWith("https://st.chatango.com")
  var exist = typeof(_domain) === "undefined"
  if (!domain) {
    var redirect = confirm("Incorrect domain, redirect to https://st.chatango.com ?")
    if (redirect) location.href = "https://st.chatango.com"
  } else if (!exist) {
    var refresh = confirm("BetterChatango has already been launched, do you need to reload it?")
    if (refresh) location.reload()
  } else {
    // Set HTML page of the client
    var source = "https://vissle.me/client"

    // Currently unused and in development
    var language = localStorage.getItem("language")
    if (language && language != "en-us") source += `?${language}`

    // Get HTML page of the client
    fetch(source).then(async response => {
      var data = await response.text()
      document.querySelector("html").innerHTML = data
      var script = document.createElement("script")
      // Raw source code of the client, view URL to see the mess of 12.5k lines of code in 1 file (Separated files on GitHub coming soon)
      script.src = `https://vissle.me/client/inject`
      script.onerror = function(x) {
        console.log(x)
        alert("An error occurred.")
        location.reload()
      }
      document.lastElementChild.appendChild(script)
    }).catch(e => {
      console.error(e)
      alert("An error occurred while fetching the client, please try again later.")
    })
  }
  // Remove this script itself
  document.currentScript.remove()
})(location.href)