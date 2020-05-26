// doi.js

// from 'utils.js'
/*   global getUrlByParameter */

function getMetadata(entry) {
  const MAX_TITLE_LEN = 300
  let title = entry.title
  if (title.length > MAX_TITLE_LEN) {
    title = title.slice(0, MAX_TITLE_LEN) + '...'
  }
  let author = ''
  if (entry.authors) {
    author = entry.authors[0]
    if (entry.authors.length > 1) {
      author = author + ' et al.'
    }
  } else if (entry.contribs) {
    author = entry.contribs[0].raw_name
    if (entry.contribs.length > 1) {
      author = author + ' et al.'
    }
  }
  let journal = entry.journal
  let url = '#'
  if (entry.url) {
    url = entry.url
  }
  return {
    'title': title,
    'author': author,
    'journal': journal,
    'url': url,
    'source': entry.source
  }
}

function makeEntry (data) {
  let paper = $('<div>').append(
    $('<p class="text_elements">').append(
      $('<p>').append(
        $('<strong>').text(data.title)
      ),
      $('<p>').append(data.author)
      // Journal was also commented out in the previous version.
      // $('<p>').append(journal)
    )
  )
  let bottom_details = $('<div>').addClass('bottom_details')
  if (data.url !== '#') {
    bottom_details.append(
      $('<button>').attr({ 'class': 'btn btn-success' }).text('Read Paper')
        .click(function () {
          chrome.storage.sync.get(['show_context'], function (event1) {
            if (event1.show_context === undefined) {
              event1.show_context = 'tab'
            }
            if (event1.show_context === 'tab') {
              chrome.tabs.create({ url: data.url })
            } else {
              chrome.windows.getCurrent(function (window) {
                const height = window.height
                const width = window.width
                chrome.windows.create({ url: data.url,
                  width: width / 2,
                  height: height,
                  top: 0,
                  left: 0 })
              })
            }
          })
        }),
      $('<div>').addClass('small text-muted').text('source: ' + data.source)
    )
  } else {
    bottom_details.append($('<p>').text('Paper Unavailable').addClass('not_found'))
  }
  paper.append(bottom_details)
  return paper
}

function createPage () {
  let container = $('#container-whole-doi')
  const url = getUrlByParameter('url')
  $.getJSON(hostURL + 'context/papers?url=' + url, function(response) {
    $('.loader').hide()
    if (response.status && response.status === 'error') {
      $('#doi-heading').html(response.message)
    } else {
      for (var i = 0; i < response.length; i++) {
        if (response[i]) {
          let data = getMetadata(response[i])
          let paper = makeEntry(data)
          // add to list
          if (data.url !== '#') {
            container.prepend(paper)
          } else {
            container.append(paper)
          }
        }
      }
    }
  })
}

if (typeof module !== 'undefined') {
  module.exports = {
    getMetadata: getMetadata,
    makeEntry: makeEntry
  }
}
