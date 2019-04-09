global_url = ''
var set_of_sites;
chrome.storage.sync.get(['newshosts'], function(event){
  set_of_sites = new Set(event.newshosts);
})
function remove_port(url) {
  if (url.substr(-4) === ':80/') {
    url = url.substring(0, url.length - 4)
  }
  return url
}

function remove_wbm(url) {
  var pos = url.indexOf('/http')
  var new_url = ''
  if (pos !== -1) {
    new_url = url.substring(pos + 1)
  } else {
    pos = url.indexOf('/www')
    new_url = url.substring(pos + 1)
  }
  return remove_port(new_url)
}

function remove_alexa(url) {
  var pos = url.indexOf('/siteinfo/')
  var new_url = url.substring(pos + 10)
  return remove_port(new_url)
}

function remove_whois(url) {
  var pos = url.indexOf('/whois/')
  var new_url = url.substring(pos + 7)
  return remove_port(new_url)
}
/* Common method used everywhere to retrieve cleaned up URL */
function retrieve_url() {
  var search_term = $('#search_input').val()
  var url = ''
  if (search_term === '') {
    url = global_url
  } else {
    url = search_term
  }
  return url
}

function get_clean_url() {
  var url = retrieve_url()
  if (url.includes('web.archive.org')) {
    url = remove_wbm(url)
  } else if (url.includes('www.alexa.com')) {
    url = remove_alexa(url)
  } else if (url.includes('www.whois.com')) {
    url = remove_whois(url)
  }
  return url
}

function search_box_activate() {
  const search_box = document.getElementById('search_input')
  search_box.addEventListener('keydown', (e) => {
    if ((e.keyCode === 13  || e.which === 13) && search_box.value !== '') {
      chrome.tabs.create({ url: 'https://web.archive.org/web/*/' + search_box.value })
    } 
  })
}

function save_now() {
  let clean_url = get_clean_url()
  chrome.runtime.sendMessage({
    message: 'openurl',
    wayback_url: 'https://web-beta.archive.org/save/',
    page_url: clean_url,
    method: 'save'
  })
  .then(handleResponse, handleError)
}

function recent_capture() {
  chrome.runtime.sendMessage({
    message: 'openurl',
    wayback_url: 'https://web.archive.org/web/2/',
    page_url: get_clean_url(),
    method: 'recent'
  })
}

function first_capture() {
  chrome.runtime.sendMessage({
    message: 'openurl',
    wayback_url: 'https://web.archive.org/web/0/',
    page_url: get_clean_url(),
    method: 'first'
  })
}

function view_all() {
  chrome.runtime.sendMessage({
    message: 'openurl',
    wayback_url: 'https://web.archive.org/web/*/',
    page_url: get_clean_url(),
    method: 'viewall'
  })
}

function get_url() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    global_url = tabs[0].url
  })
}

function social_share(eventObj) {
  var parent = eventObj.target.parentNode
  var id = parent.getAttribute('id')
  var sharing_url = ''
  var url = retrieve_url()
  var overview_url = 'https://web.archive.org/web/*/'
  if (url.includes('web.archive.org')) {
    sharing_url = url // If the user is already at a playback page,share that URL
  } else {
    sharing_url = overview_url + get_clean_url() // When not on a playback page,share the overview version of that URL
  }
  var open_url = ''
  if (!(url.includes('chrome://') || url.includes('chrome-extension://'))) { // Prevents sharing some unnecessary page
    if (id.includes('fb')) {
      open_url = 'https://www.facebook.com/sharer/sharer.php?u=' + sharing_url // Share the wayback machine's overview of the URL
    } else if (id.includes('twit')) {
      open_url = 'https://twitter.com/home?status=' + sharing_url
    } else if (id.includes('linkedin')) {
      open_url = 'https://www.linkedin.com/shareArticle?url=' + sharing_url
    }
    window.open(open_url, 'newwindow', 'width=800, height=280,left=0')
  }
}

function search_tweet(eventObj) {
  var url = get_clean_url()
  url = url.replace(/^https?:\/\//, '')
  if (url.slice(-1) === '/') url = url.substring(0, url.length - 1)
  var open_url = 'https://twitter.com/search?q=' + url
  chrome.storage.sync.get(['show_context'], function (event1) {
    if (event1.show_context === 'tab' || event1.show_context === undefined) {
      chrome.tabs.create({ url: open_url })
    } else {
      chrome.system.display.getInfo(function (displayInfo) {
        let height = displayInfo[0].bounds.height
        let width = displayInfo[0].bounds.width
        chrome.windows.create({ url: open_url, width: width / 2, height: height, top: 0, left: width / 2, focused: true })
      })
    }
  })
}

function display_list() {
  const search_input = document.getElementById('search_input')
  const suggestion_box = document.getElementById('suggestion-box')
  suggestion_box.textContent = ''
  suggestion_box.style.display = 'none'
  $.getJSON('https://web.archive.org/__wb/search/host?q=' + search_input.value, function (data) {
    suggestion_box.textContent = ''
    suggestion_box.style.display = 'none'
    if (data.hosts.length > 0 && search_input.value !== '') {
      suggestion_box.style.display = 'block'
      const container = document.createDocumentFragment()
      for (var i = 0; i < data.hosts.length; i++) {
        const lst = document.createElement('li')
        const anchor = document.createElement('a')
        anchor.setAttribute('role', 'button')
        anchor.textContent = data.hosts[i].display_name
        anchor.addEventListener('click', (event) => {
          search_input.value = event.target.innerHTML
          suggestion_box.text = ''
          suggestion_box.style.display = 'none'
        })
        lst.appendChild(anchor)
        container.appendChild(lst)
      }
      suggestion_box.appendChild(container)
    }
  })
}

function display_suggestions(e) {
  const suggestion_box = document.getElementById('suggestion-box')
  suggestion_box.textContent = ''
  suggestion_box.style.display = 'none'
  if (e.keyCode === 13 || e.which === 13) {
    e.preventDefault()
  } else {
    // setTimeout is used to get the text in the text field after key has been pressed
    window.setTimeout(function () {
      const search_input = document.getElementById('search_input')
      if (search_input.value.length >= 3) {
        display_list()
      } else {
        const suggestion_box = document.getElementById('suggestion-box')
        suggestion_box.textContent = ''
        suggestion_box.style.display = 'none'
      }
    }, 0.1)
  }
}
function open_feedback_page() {
  var feedback_url = 'https://chrome.google.com/webstore/detail/wayback-machine/fpnmgdkabkmnadcjpehmlllkndpkmiak/reviews?hl=en'
  chrome.tabs.create({ url: feedback_url })
}

function about_support() {
  window.open('about.html', 'newwindow', 'width=1200, height=900,left=0').focus()
}

function makeModal() {
  var url = get_clean_url()
  chrome.runtime.sendMessage({ message: 'makemodal', rturl: url })
}

function settings() {
  window.open('settings.html', 'newwindow', 'width=600, height=700,left=0,top=30');
}

function show_all_screens() {
  var url = get_clean_url()
  chrome.runtime.sendMessage({ message: 'showall', url: url })
}

function borrow_books() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    url = tabs[0].url
    tabId = tabs[0].id
    chrome.browserAction.getBadgeText({ tabId: tabId }, function (result) {
      if (result.includes('B') && url.includes('www.amazon') && url.includes('/dp/')) {
        get_amazonbooks(url).then(response => {
          if (response['metadata'] && response['metadata']['identifier-access']) {
            let details_url = response['metadata']['identifier-access']
            $('#borrow_books_tr').css({ 'display': 'block' }).click(function () {
              chrome.tabs.create({ url: details_url })
            })
          }
        })
      }
    })
  })
}

function show_news() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    url = tabs[0].url
    var news_host = new URL(url).hostname
    tabId = tabs[0].id
    chrome.storage.sync.get(['news', 'show_context'], function (event) {
      if (event.news && set_of_sites.has(news_host)) {
        $('#news_recommend_tr').show().click(() => {
          if (event.show_context === 'tab' || event.show_context === undefined) {
            chrome.tabs.create({ url: chrome.runtime.getURL('recommendations.html') + '?url=' + url })
          } else {
            chrome.system.display.getInfo(function (displayInfo) {
              const height = displayInfo[0].bounds.height
              const width = displayInfo[0].bounds.width
              chrome.windows.create({ url: chrome.runtime.getURL('recommendations.html') + '?url=' + url, width: width / 2, height: height, top: 0, left: width / 2, focused: true })
            })
          }
        })
      }
    })
  })
}
function show_wikibooks() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const url = tabs[0].url
    if (url.match(/^https?:\/\/[\w\.]*wikipedia.org/)) {
      const tabId = tabs[0].id
      chrome.storage.sync.get(['wikibooks', 'doi', 'show_context'], function (event) {
        if (event.show_context === undefined) {
          event.show_context = 'tab'
        }
        if (event.wikibooks) {
          $('#wikibooks_tr').show().click(function () {
            if (event.show_context === 'tab') {
              chrome.tabs.create({ url: chrome.runtime.getURL('booklist.html') + '?url=' + url })
            } else {
              chrome.windows.getCurrent(function (window) {
                const height = window.height
                const width = window.width
                chrome.windows.create({
                  url: chrome.runtime.getURL('booklist.html') + '?url=' + url,
                  width: width / 2,
                  height: height,
                  top: 0,
                  left: width / 2
                })
              })
            }
          })
        }
        if (event.doi === true) {
          $('#doi_tr').show().click(function () {
            if (event.show_context === 'tab') {
              chrome.tabs.create({ url: chrome.runtime.getURL('doi.html') + '?url=' + url })
            } else {
              chrome.windows.getCurrent(function (window) {
                const height = window.height
                const width = window.width
                chrome.windows.create({
                  url: chrome.runtime.getURL('doi.html') + '?url=' + url,
                  width: width / 2,
                  height: height,
                  top: 0,
                  left: width / 2
                })
              })
            }
          })
        }
      })
    }
  })
}

window.onloadFuncs = [get_url, borrow_books, show_news, show_wikibooks, search_box_activate]
window.onload = function () {
  for (var i in this.onloadFuncs) {
    this.onloadFuncs[i]()
  }
}
$('#save_now').click(save_now)
$('#recent_capture').click(recent_capture)
$('#first_capture').click(first_capture)
$('#fb_share').click(social_share)
$('#twit_share').click(social_share)
$('#linkedin_share').click(social_share)
$('#search_tweet').click(search_tweet)
$('#about_support_button').click(about_support)
$('#settings_button').click(settings)
$('#context-screen').click(show_all_screens)
$('.feedback').click(open_feedback_page)

$('#overview').click(view_all)
$('#make_modal').click(makeModal)
$('#search_input').keydown(display_suggestions)
