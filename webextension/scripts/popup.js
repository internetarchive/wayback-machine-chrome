// popup.js

// from 'utils.js'
/*   global isArchiveUrl, isValidUrl, makeValidURL, isNotExcludedUrl, get_clean_url, openByWindowSetting, hostURL */
/*   global feedbackURL, newshosts, dateToTimestamp, timestampToDate, viewableTimestamp, searchValue, fixedEncodeURIComponent */
/*   global attachTooltip */

function homepage() {
  openByWindowSetting('https://web.archive.org/')
}

// Popup tip over settings tab icon after first load.
function showSettingsTabTip() {
  let tt = $('<div>').append($('<p>').text('There are more great features in Settings!').attr({ 'class': 'setting-tip' }))[0].outerHTML
  let tabItem = $('#settings-tab-btn').parent()
  setTimeout(() => {
    tabItem.append(attachTooltip(tabItem, tt, 'top'))
    .tooltip('show')
    .on('mouseenter', () => {
      $(tabItem).tooltip('hide')
      // prevent tooltip from ever showing again once mouse entered
      chrome.storage.local.set({ show_settings_tab_tip: false }, () => {})
    })
  }, 500)
}

function setupSettingsTabTip() {
  chrome.storage.local.get(['show_settings_tab_tip'], (settings) => {
    if (settings && settings.show_settings_tab_tip) {
      showSettingsTabTip()
    }
  })
}

function doSaveNow() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let url = searchValue || get_clean_url(tabs[0].url)
    let options = { 'capture_all': 1 }
    if ($('#chk-outlinks').prop('checked') === true) {
      options['capture_outlinks'] = 1
      if ($('#email-outlinks-setting').prop('checked') === true) {
        options['email_result'] = 1
      }
    }
    if ($('#chk-screenshot').prop('checked') === true) {
      options['capture_screenshot'] = 1
    }
    chrome.runtime.sendMessage({
      message: 'openurl',
      wayback_url: hostURL + 'save/',
      page_url: url,
      options: options,
      method: 'save',
      atab: tabs[0]
    })
  })
}

function last_save() {
  checkAuthentication((result) => {
    if (!(result && result.auth_check)) {
      loginError()
    } else {
      loginSuccess()
    }
  })
}

function loginError() {
  $('#bulk-save-btn').attr('disabled', true)
  $('#bulk-save-btn').off('click')
  $('#spn-btn').addClass('flip-inside')
  $('#spn-back-label').text('Log In to Save Page')
  $('#spn-front-label').parent().attr('disabled', true)
  $('#spn-btn').off('click').click(() => {
    show_login_page()
  })
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      let url = searchValue || get_clean_url(tabs[0].url)
      if (!isNotExcludedUrl(url)) {
        setExcluded()
      }
    }
  })
}

function loginSuccess() {
  $('.tab-item').css('width', '18%')
  $('#logout-tab-btn').css('display', 'inline-block')
  $('#spn-front-label').parent().removeAttr('disabled')
  $('#spn-btn').off('click')
  $('#bulk-save-btn').removeAttr('disabled')
  $('#bulk-save-btn').click(bulkSave)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      let url = searchValue || get_clean_url(tabs[0].url)
      if (isValidUrl(url) && isNotExcludedUrl(url) && !isArchiveUrl(url)) {
        $('#spn-btn').click(doSaveNow)
        chrome.storage.local.get(['private_mode_setting'], (settings) => {
          // auto save page
          if (settings && (settings.private_mode_setting === false)) {
            chrome.runtime.sendMessage({
              message: 'getLastSaveTime',
              page_url: url
            }, (message) => {
              if (message && (message.message === 'last_save') && message.timestamp) {
                $('#spn-back-label').text('Last saved: ' + viewableTimestamp(message.timestamp))
                $('#spn-btn').addClass('flip-inside')
              }
            })
          }
        })
      } else {
        setExcluded()
        $('#spn-back-label').text('URL not supported')
      }
    }
  })
}

function checkAuthentication(callback) {
  chrome.runtime.sendMessage({
    message: 'auth_check'
  }, callback)
}

function recent_capture() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let url = searchValue || get_clean_url(tabs[0].url)
    chrome.runtime.sendMessage({
      message: 'openurl',
      wayback_url: 'https://web.archive.org/web/2/',
      page_url: url,
      method: 'recent'
    })
  })
}

function first_capture() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let url = searchValue || get_clean_url(tabs[0].url)
    chrome.runtime.sendMessage({
      message: 'openurl',
      wayback_url: 'https://web.archive.org/web/0/',
      page_url: url,
      method: 'first'
    })
  })
}

function view_all() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let url = searchValue || get_clean_url(tabs[0].url)
    chrome.runtime.sendMessage({
      message: 'openurl',
      wayback_url: 'https://web.archive.org/web/*/',
      page_url: url,
      method: 'viewall'
    })
  })
}

function social_share(eventObj) {
  let parent = eventObj.target.parentNode
  let id = eventObj.target.getAttribute('id')
  if (id === null) {
    id = parent.getAttribute('id')
  }
  // Share wayback link to the most recent snapshot of URL at the time this is called.
  let timestamp = dateToTimestamp(new Date())
  let wayback_url = 'https://web.archive.org/web/' + timestamp + '/'

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let url = get_clean_url(searchValue || tabs[0].url)
    let sharing_url = isArchiveUrl(url) ? url : wayback_url + url
    if (isNotExcludedUrl(url)) {
      // Latest Social Share URLs: https://github.com/bradvin/social-share-urls
      if (id.includes('facebook-share-btn')) {
        openByWindowSetting('https://www.facebook.com/sharer.php?u=' + fixedEncodeURIComponent(sharing_url))
      } else if (id.includes('twitter-share-btn')) {
        openByWindowSetting('https://twitter.com/intent/tweet?url=' + fixedEncodeURIComponent(sharing_url))
      } else if (id.includes('linkedin-share-btn')) {
        openByWindowSetting('https://www.linkedin.com/sharing/share-offsite/?url=' + fixedEncodeURIComponent(sharing_url))
      } else if (id.includes('copy-link-btn') && navigator.clipboard) {
        navigator.clipboard.writeText(sharing_url).then(() => {
          let copiedMsg = $('#link-copied-msg')
          copiedMsg.text('Copied to Clipboard').fadeIn('fast')
          setTimeout(() => {
            copiedMsg.fadeOut('fast')
          }, 1500)
        })
      }
    }
  })
}

function searchTweet() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let url = searchValue || get_clean_url(tabs[0].url)
    if (isNotExcludedUrl(url)) {
      if (url.slice(-1) === '/') url = url.substring(0, url.length - 1)
      var open_url = 'https://twitter.com/search?q=' + fixedEncodeURIComponent(url)
      openByWindowSetting(open_url)
    }
  })
}

// Update the UI when user is using the Search Box.
function useSearchBox() {
  chrome.runtime.sendMessage({ message: 'clearCountBadge' })
  chrome.runtime.sendMessage({ message: 'clearResource' })
  chrome.runtime.sendMessage({ message: 'clearFactCheck' })
  $('#fact-check-btn').removeClass('btn-purple')
  $('#suggestion-box').text('').hide()
  $('#url-not-supported-msg').hide()
  $('#using-search-msg').show()
  $('#readbook-container').hide()
  $('#tvnews-container').hide()
  $('#wiki-container').hide()
  clearWaybackCount()
  last_save()
}

function search_box_activate() {
  const search_box = document.getElementById('search-input')
  search_box.addEventListener('keyup', (e) => {
    // exclude UP and DOWN keys from keyup event
    if (!(e.keyCode === 38 || e.which === 38 || e.keyCode === 40 || e.which === 40) && (search_box.value.length >= 0) && isNotExcludedUrl(search_box.value)) {
      searchValue = get_clean_url(makeValidURL(search_box.value))
      // use searchValue if it is valid, else update UI
      searchValue ? useSearchBox() : $('#using-search-msg').hide()
    }
  })
}

function arrow_key_access() {
  const list = document.getElementById('suggestion-box')
  const search_box = document.getElementById('search-input')
  let index = search_box

  search_box.addEventListener('keydown', (e) => {
    // listen for up key
    if (e.keyCode === 38 || e.which === 38) {
      if (index === list.firstChild && index && list.lastChild) {
        if (index.classList.contains('focused')) { index.classList.remove('focused') }
        index = list.lastChild
        if (!index.classList.contains('focused')) { index.classList.add('focused') }
        search_box.value = index.textContent
      } else if (index === search_box) {

      } else if (index !== search_box && index && index.previousElementSibling) {
        if (index.classList.contains('focused')) { index.classList.remove('focused') }
        index = index.previousElementSibling
        if (!index.classList.contains('focused')) { index.classList.add('focused') }
        search_box.value = index.textContent
      }

      // listen for down key
    } else if (e.keyCode === 40 || e.which === 40) {
      if (index === search_box && list.firstChild) {
        index = list.firstChild
        if (!index.classList.contains('focused')) { index.classList.add('focused') }
        search_box.value = index.textContent
      } else if (index === list.lastChild && list.lastChild) {
        if (index.classList.contains('focused')) { index.classList.remove('focused') }
        index = list.firstChild
        if (!index.classList.contains('focused')) { index.classList.add('focused') }
        search_box.value = index.textContent
      } else if (index !== search_box && index && index.nextElementSibling) {
        if (index.classList.contains('focused')) { index.classList.remove('focused') }
        index = index.nextElementSibling
        if (!index.classList.contains('focused')) { index.classList.add('focused') }
        search_box.value = index.textContent
      }
    } else {
      index = search_box
    }
  })
}

function display_list(key_word) {
  $('#suggestion-box').text('').hide()
  $.getJSON(hostURL + '__wb/search/host?q=' + key_word, (data) => {
    $('#suggestion-box').text('').hide()
    if (data.hosts.length > 0 && $('#search-input').val() !== '') {
      $('#suggestion-box').show()
      arrow_key_access()
      for (var i = 0; i < data.hosts.length; i++) {
        $('#suggestion-box').append(
          $('<div>').attr('role', 'button').text(data.hosts[i].display_name).click((event) => {
            document.getElementById('search-input').value = event.target.innerHTML
            searchValue = get_clean_url(makeValidURL(event.target.innerHTML))
            if (searchValue) { useSearchBox() }
          })
        )
      }
    }
  })
}

let timer
function display_suggestions(e) {
  // exclude arrow keys from keypress event
  if (e.keyCode === 38 || e.keyCode === 40) { return false }
  $('#suggestion-box').text('').hide()
  if (e.keyCode === 13) {
    e.preventDefault()
  } else {
    if ($('#search-input').val().length >= 1) {
      $('#url-not-supported-msg').hide()
    } else {
      $('#url-not-supported-msg').show()
      $('#using-search-msg').hide()
    }
    clearTimeout(timer)
    // Call display_list function if the difference between keypress is greater than 300ms (Debouncing)
    timer = setTimeout(() => {
      display_list($('#search-input').val())
    }, 300)
  }
}

function open_feedback_page() {
  openByWindowSetting(feedbackURL)
}

function open_donations_page() {
  let donation_url = 'https://archive.org/donate/'
  openByWindowSetting(donation_url)
}

function about_support() {
  openByWindowSetting('about.html')
}

function sitemap() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let url = searchValue || get_clean_url(tabs[0].url)
    if (isNotExcludedUrl(url)) { openByWindowSetting('https://web.archive.org/web/sitemap/' + url) }
  })
}

function showSettings() {
  $('#popup-page').hide()
  $('#login-page').hide()
  $('#setting-page').show()
}

function show_login_page() {
  $('#popup-page').hide()
  $('#setting-page').hide()
  $('#login-message').hide()
  $('#login-page').show()
}

function show_all_screens() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let url = searchValue || get_clean_url(tabs[0].url)
    chrome.runtime.sendMessage({ message: 'showall', url: url })
  })
}

function borrow_books() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url
    if (url.includes('www.amazon') && url.includes('/dp/')) {
      chrome.runtime.sendMessage({ message: 'getToolbarState', atab: tabs[0] }, (result) => {
        let state = (result && result.stateArray) ? new Set(result.stateArray) : new Set()
        if (state.has('R')) {
          $('#readbook-container').show()
          chrome.storage.local.get(['tab_url', 'detail_url', 'view_setting'], (settings) => {
            if (!settings) { return }
            const stored_url = settings.tab_url
            const detail_url = settings.detail_url
            const context = settings.view_setting
            // Checking if the tab url is the same as the last stored one
            if (stored_url === url) {
              // if same, use the previously fetched url
              $('#readbook-btn').click(() => {
                openByWindowSetting(detail_url, context)
              })
            } else {
              // if not, fetch it again
              fetch(hostURL + 'services/context/amazonbooks?url=' + url)
                .then(res => res.json())
                .then(response => {
                  if (response['metadata'] && response['metadata']['identifier-access']) {
                    const new_details_url = response['metadata']['identifier-access']
                    $('#readbook-btn').click(() => {
                      openByWindowSetting(new_details_url, context)
                    })
                  }
                })
            }
          })
        }
      })
    }
  })
}

function show_news() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url
    const news_host = new URL(url).hostname
    if (newshosts.has(news_host)) {
      chrome.runtime.sendMessage({ message: 'getToolbarState', atab: tabs[0] }, (result) => {
        let state = (result && result.stateArray) ? new Set(result.stateArray) : new Set()
        if (state.has('R')) {
          $('#tvnews-container').show()
          $('#tvnews-btn').click(() => {
            chrome.storage.local.get(['view_setting'], function (settings) {
              if (settings && settings.view_setting) {
                const URL = chrome.runtime.getURL('recommendations.html') + '?url=' + url
                openByWindowSetting(URL, settings.view_setting)
              } else {
                console.log('Missing view_setting!')
              }
            })
          })
        }
      })
    }
  })
}

function show_wikibooks() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url
    if (url.match(/^https?:\/\/[\w\.]*wikipedia.org/)) {
      chrome.runtime.sendMessage({ message: 'getToolbarState', atab: tabs[0] }, async (result) => {
        let state = (result && result.stateArray) ? new Set(result.stateArray) : new Set()
        if (state.has('R')) {
          var show_books = await wikiDetails('getWikipediaBooks', url)
          var show_papers = await wikiDetails('getCitedPapers', url)
          if (show_books && show_papers) {
            $('#wiki-container').show()
          } else if (show_books) {
            $('#wikibooks-btn').addClass('btn-wide')
            $('#wikipapers-btn').hide()
            $('#wiki-container').show()
          } else {
            $('#wikipapers-btn').addClass('btn-wide')
            $('#wikipapers-btn').attr('style', 'margin-left: 0px !important');
            $('#wikibooks-btn').hide()
            $('#wiki-container').show()
          }

          // show wikipedia cited books & papers buttons
          $('#wikibooks-btn').click(() => {
            const URL = chrome.runtime.getURL('booklist.html') + '?url=' + url
            openByWindowSetting(URL)
          })
          $('#wikipapers-btn').click(() => {
            const URL = chrome.runtime.getURL('doi.html') + '?url=' + url
            openByWindowSetting(URL)
          })
        }
      })
    }
  })
}

function wikiDetails (message, query) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      message,
      query
    }, (result) => {
      if (result && result.status !== 'error') {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

function setUpFactCheck() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = get_clean_url(tabs[0].url)
    if (isNotExcludedUrl(url)) {
      chrome.storage.local.get(['fact_check_setting'], (settings) => {
        if (settings && settings.fact_check_setting) {
          chrome.runtime.sendMessage({ message: 'getToolbarState', atab: tabs[0] }, (result) => {
            let state = (result && result.stateArray) ? new Set(result.stateArray) : new Set()
            if (state.has('F')) {
              // show purple fact-check button
              $('#fact-check-btn').addClass('btn-purple')
            }
          })
        }
      })
    }
  })
}

// Common function to show different context
function showContext(eventObj) {
  let id = eventObj.target.getAttribute('id')
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = searchValue || get_clean_url(tabs[0].url)
    if (isNotExcludedUrl(url) && isValidUrl(url)) {
      if (id.includes('fact-check-btn')) {
        const factCheckUrl = chrome.runtime.getURL('fact-check.html') + '?url=' + url
        openByWindowSetting(factCheckUrl)
      } else if (id.includes('alexa-btn')) {
        const alexaUrl = chrome.runtime.getURL('alexa.html') + '?url=' + url
        openByWindowSetting(alexaUrl)
      } else if (id.includes('annotations-btn')) {
        const annotationsUrl = chrome.runtime.getURL('annotations.html') + '?url=' + url
        openByWindowSetting(annotationsUrl)
      } else if (id.includes('more-info-btn')) {
        const wbmsummaryUrl = chrome.runtime.getURL('wbmsummary.html') + '?url=' + url
        openByWindowSetting(wbmsummaryUrl)
      } else if (id.includes('tag-cloud-btn')) {
        const tagsUrl = chrome.runtime.getURL('tagcloud.html') + '?url=' + url
        openByWindowSetting(tagsUrl)
      }
    }
  })
}

function setExcluded() {
  $('#spn-btn').addClass('flip-inside')
  $('#url-not-supported-msg').text('URL not supported')
}

// For removing focus outline around buttons on mouse click, while keeping during keyboard use.
function clearFocus() {
  document.activeElement.blur()
}

function setupWaybackCount() {
  chrome.storage.local.get(['wm_count_setting'], (settings) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let url = tabs[0].url
      if (settings && settings.wm_count_setting && isValidUrl(url) && isNotExcludedUrl(url) && !isArchiveUrl(url)) {
        showWaybackCount(url)
        chrome.runtime.sendMessage({ message: 'updateCountBadge' })
      } else {
        clearWaybackCount()
        chrome.runtime.sendMessage({ message: 'clearCountBadge' })
      }
    })
  })
}

// Displays Wayback count, and Oldest and Newest timestamps
function showWaybackCount(url) {
  $('#wayback-count-msg').show()
  chrome.runtime.sendMessage({ message: 'getCachedWaybackCount', url: url }, (result) => {
    if (result && ('total' in result)) {
      // set label
      let text = ''
      if (result.total === 1) {
        text = 'Saved once.'
      } else if (result.total > 1) {
        text = 'Saved ' + result.total.toLocaleString() + ' times.'
      } else {
        text = 'This page has not been archived.'
      }
      $('#wayback-count-msg').text(text)
    } else {
      clearWaybackCount()
    }
    if (result && result.first_ts) {
      let date = timestampToDate(result.first_ts)
      $('#oldest-btn').attr('title', date.toLocaleString())
    }
    if (result && result.last_ts) {
      let date = timestampToDate(result.last_ts)
      $('#newest-btn').attr('title', date.toLocaleString())
    }
  })
}

function clearWaybackCount() {
  $('#wayback-count-msg').html('').hide()
  $('#oldest-btn').attr('title', null)
  $('#newest-btn').attr('title', null)
}

function bulkSave() {
  openByWindowSetting('../bulk-save.html', 'windows')
}

function setupSaveButton() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.runtime.sendMessage({ message: 'getToolbarState', atab: tabs[0] }, (result) => {
      let state = (result && result.stateArray) ? new Set(result.stateArray) : new Set()
      if (state.has('S')) {
        showSaving()
      }
    })
  })
}

function showSaving() {
  $('#save-progress-bar').show()
  $('#spn-front-label').text('Archiving URL...')
}

// make the tab/window option in setting page checked according to previous setting
chrome.storage.local.get(['view_setting'], (settings) => {
  if (settings && settings.view_setting) {
    $(`input[name=tw][value=${settings.view_setting}]`).prop('checked', true)
  }
})

// respond to Save Page Now success
chrome.runtime.onMessage.addListener(
  (message) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let atab = message.atab
      if (atab && atab.id && (atab.id === tabs[0].id)) {
        if (message.message === 'save_success') {
          $('#save-progress-bar').hide()
          $('#spn-front-label').text('Save successful')
          $('#spn-back-label').text('Last saved: ' + viewableTimestamp(message.timestamp))
          $('#spn-btn').addClass('flip-inside')
          setupWaybackCount()
        } else if (message.message === 'save_archived') {
          // snapshot already archived within timeframe
          $('#save-progress-bar').hide()
          $('#spn-front-label').text('Recently Saved')
        } else if (message.message === 'save_start') {
          showSaving()
        } else if (message.message === 'save_error') {
          $('#save-progress-bar').hide()
          $('#spn-front-label').text('Save Failed')
        }
      }
    })
  }
)

window.onloadFuncs = [last_save, borrow_books, show_news, search_box_activate, setupWaybackCount, setupSaveButton, setUpFactCheck]
window.onload = () => {
  for (var i in this.onloadFuncs) {
    this.onloadFuncs[i]()
  }
}

$(show_wikibooks)
$(setupSettingsTabTip)

$('.logo-wayback-machine').click(homepage)
$('#newest-btn').click(recent_capture)
$('#oldest-btn').click(first_capture)
$('#facebook-share-btn').click(social_share)
$('#twitter-share-btn').click(social_share)
$('#linkedin-share-btn').click(social_share)
$('#copy-link-btn').click(social_share)
$('#tweets-btn').click(searchTweet)
$('#about-tab-btn').click(about_support)
$('#donate-tab-btn').click(open_donations_page)
$('#settings-tab-btn').click(showSettings)
$('#setting-page').hide()
$('#login-page').hide()
$('#feedback-tab-btn').click(open_feedback_page)
$('#overview-btn').click(view_all)
$('#site-map-btn').click(sitemap)
$('#search-input').keydown(display_suggestions)
$('.btn').click(clearFocus)
$('#fact-check-btn').click(showContext)
$('#alexa-btn').click(showContext)
$('#annotations-btn').click(showContext)
// $('#more-info-btn').click(showContext)
$('#tag-cloud-btn').click(showContext)
