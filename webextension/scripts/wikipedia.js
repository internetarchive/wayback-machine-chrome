// wikipedia.js
// This file is loaded every time URL matches '*.wikipedia.org/*' as defined in manifest.json.
// This script adds buttons next to isbns on wikipedia pages that will redirect
// the user to a readable digital copy of the referenced book.

// from 'utils.js'
/*   global attachTooltip, isNotExcludedUrl */

function addCitations () {
  if (isNotExcludedUrl(location.href)) {
    wikipediaBooks(location.href).then((data) => {
      let books = $("a[title^='Special:BookSources']")
      for (let book of books) {
        let isbn = book.text.replace(/-/g, '')
        let id = getIdentifier(data[isbn])
        let metadata = getMetadata(data[isbn])
        let page = getPageFromCitation(book)
        if (id) {
          let icon = addReadIcon(id, metadata)
          if (page) {
            icon[0].href += '/page/' + page
          }
          book.parentElement.append(icon[0])
        } else {
          let icon = addDonateIcon(isbn)
          book.parentElement.append(icon[0])
        }
      }
    }).catch((error) => {
      console.log(error)
    })
  }
}

function getMetadata (book) {
  const MAX_TITLE_LEN = 300
  if (book && book.metadata) {
    return {
      'title': book.metadata.title.length > MAX_TITLE_LEN ? book.metadata.title.slice(0, MAX_TITLE_LEN) + '...' : book.metadata.title,
      'author': book.metadata.creator,
      'image': 'https://archive.org/services/img/' + book.metadata.identifier,
      'link': book.metadata['identifier-access'],
      'button_text': 'Read Book',
      'button_class': 'btn btn-auto btn-blue',
      'readable': true
    }
  }
  return false
}

function addDonateIcon (isbn) {
  return attachTooltip(
    createDonateAnchor(isbn),
    createDonateToolTip(isbn)
  )
}
function addReadIcon (id, metadata) {
  return attachTooltip(
    createArchiveAnchor(id),
    createReadToolTip(id, metadata)
  )
}

function createDonateToolTip (isbn) {
  return $('<a>')
    .attr({
      'class': 'popup_box popup_donate',
      'href': 'https://www.archive.org/donate?isbn=' + isbn,
      'target': '_blank'
    })
    .append(
      $('<div>')
        .addClass('text-elements')
        .append(
          $('<p>').append(
            $('<strong>').text('Please donate $50 and we will try to purchase and digitize the book for you.')
          )
        ),
      $('<div>')
        .addClass('bottom-details text-muted')
        .append(
          $('<p>').text('Or if you have a copy of this book please mail it to: '),
          $('<p>').text('300 Funston, San Francisco, CA 94118'),
          $('<p>').text('so we can digitize it.')
        )
    )[0].outerHTML
}

function createReadToolTip (id, metadata) {
  return $('<a>')
    .attr({ 'class': 'popup_box popup_read', 'href': 'https://archive.org/details/' + id, 'target': '_blank' })
    .append(
      $('<div>')
        .addClass('text-elements')
        .append(
          $('<p>').append($('<strong>').text(metadata.title)).addClass('popup-title'),
          $('<p>').addClass('text-muted').text(metadata.author)
        ),
      $('<div>')
        .addClass('bottom-details')
        .append(
          metadata.image ? $('<img>').attr({ 'class': 'cover-img', 'src': metadata.image }) : null,
          $('<p>').text('Click To Read Now').addClass('text-muted')
        )
    )[0].outerHTML
}
function createDonateAnchor (isbn) {
  return $('<a>')
    .attr({
      'href': 'https://archive.org/donate',
      'class': 'btn-archive',
      'style': 'padding: 5px;',
      'target': '_blank'
    })
    .prepend(
      $('<img>')
        .attr({ 'alt': 'Read', 'src': chrome.extension.getURL('images/icon_color.png') })[0]
    )
}
function createArchiveAnchor (id) {
  return $('<a>')
    .attr({
      'href': 'https://archive.org/details/' + id,
      'class': 'btn-archive',
      'style': 'padding: 5px;',
      'target': '_blank'
    })
    .prepend(
      $('<img>')
        .attr({ 'alt': 'Read', 'src': chrome.extension.getURL('images/icon.png') })[0]
    )
}

function getIdentifier (book) {
  // identifier can be found as metadata.identifier
  if (book && book.metadata) { return book.metadata.identifier }
  return null
}

function getPageFromCitation (book) {
  var raw = book.parentElement.innerText
  var re = /p{1,2}\.\s(\d+)-?\d*/g
  var result = re.exec(raw)
  if (result) {
    return result[1]
  }
  return result
}

// Get all books on wikipedia page through
// https://archive.org/services/context/books?url=...
function wikipediaBooks (url) {
  // Encapsulate the chrome message sender with a promise object
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      message: 'getWikipediaBooks',
      query: url
    }, (books) => {
      if (books) {
        resolve(books)
      } else {
        reject(new Error('error'))
      }
    })
  })
}

chrome.storage.local.get(['wiki_setting'], (settings) => {
  if (settings && settings.wiki_setting) {
    addCitations()
  }
})

if (typeof module !== 'undefined') {
  module.exports = {
    addCitations
  }
}
