// booklist.js

// from 'utils.js'
/*   global openByWindowSetting, getUrlByParameter */

// from 'wikipedia.js'
/*   global wikipediaBooks, getMetadata */

// TODO: rename getMetadata in doi.js or wikipedia.js

// This runs every time booklist.html is viewed.
// It retrieves a list of book cover images.
function populateBooks(url) {
  // Gets the data for each book on the wikipedia url
  wikipediaBooks(url).then(data => {
    $('.loader').hide()
    if (data && data.message !== 'No ISBNs found in page' && data.status !== 'error') {
      for (let isbn of Object.keys(data)) {
        let metadata = getMetadata(data[isbn])
        if (metadata) {
          let book_element = addBook(metadata)
          $('#resultsTray').append(book_element)
        }
      }
    } else {
      $('.loader').hide()
      $('#resultsTray').css('grid-template-columns', 'none').append(
        $('<div>').html(data.message)
      )
    }
  }).catch((error) => {
    $('.loader').hide()
    $('#resultsTray').css('grid-template-columns', 'none').append(
      $('<div>').html(error)
    )
  })
}

function addBook (metadata) {
  let text_elements = $('<div>').attr({ 'class': 'text-elements' }).append(
    $('<h3>').text(metadata.title),
    $('<p>').text(metadata.author)
  )
  let details = $('<div>').attr({ 'class': 'bottom-details' }).append(
    metadata.image ? $('<img>').attr({ 'class': 'cover-img', 'src': metadata.image }) : $('<p>').attr({ 'class': 'cover-img' }).text('No cover available'),
    $('<button>').attr({ 'class': metadata.button_class }).text(metadata.button_text).click(() => {
      openByWindowSetting(metadata.link)
    })
  )
  return $('<div>').append(text_elements, details)
}

window.onload = () => {
  var url = getUrlByParameter('url')
  populateBooks(url)
}

if (typeof module !== 'undefined') {
  module.exports = {
    populateBooks
  }
}
