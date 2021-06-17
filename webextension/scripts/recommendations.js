// recommendations.js

// from 'utils.js'
/*   global openByWindowSetting, getUrlByParameter */

const threshold = 0.85

function parseDate (date) {
  if (typeof date === 'string') {
    const dateObject = new Date(date)
    if (dateObject.toDateString() !== 'Invalid Date') {
      return dateObject.toDateString()
    }
  }
  return ''
}

function constructArticles (clip) {
  let topElements = $('<div>').addClass('top_elements').append(
    $('<p>').text(clip.show).prepend($('<strong>').text(clip.station + ': '))
  )
  let bottomElements = $('<div>').addClass('bottom_elements').append(
    $('<a>').attr({ 'href': '#' }).append(
      $('<img class="preview-clips">').attr({ 'src': clip.preview_thumb })
    ).click(() => {
      openByWindowSetting(clip.preview_url)
    }),
    $('<p>').text(parseDate(clip.show_date))
  )
  return $('<div>').append(
    topElements,
    bottomElements
  )
}

function getDetails(article) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      message: 'tvnews',
      article: article
    }, (clips) => {
      if (clips.status !== 'error') {
        resolve(clips)
      } else {
        reject(new Error('Clips not found'))
      }
    })
  })
}

function getArticles(url) {
  getDetails(url)
  .then((clips) => {
    $('.loader').hide()
    if (clips.length > 0 && threshold >= clips[0]['similarity']) {
      for (let clip of clips) {
        if (threshold >= clip['similarity']) {
          $('#RecommendationTray').append(constructArticles(clip))
        }
      }
    } else {
      $('#RecommendationTray').css({ 'grid-template-columns': 'none' }).append(
        $('<p>').text('No Related Clips Found...').css({ 'margin': 'auto' })
      )
    }
  })
  .catch((err) => {
    $('.loader').hide()
    $('#RecommendationTray').css({ 'grid-template-columns': 'none' }).append(
      $('<p>').text(err).css({ 'margin': 'auto' })
    )
  })
}

// If not running through mocha, then only execute
if (!isInTestEnv) {
  getArticles(getUrlByParameter('url'))
}

if (typeof module !== 'undefined') {
  module.exports = {
    getArticles,
    parseDate
  }
}
