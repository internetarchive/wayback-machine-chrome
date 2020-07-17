// overview.js

// from 'utils.js'
/*   global getUrlByParameter, hostURL, getWaybackCount, timestampToDate */

function get_WBMSummary () {
  get_details()
  first_archive_details()
  recent_archive_details()
  $('#loader_wbmsummary').hide()
}

function get_details () {
  var url = getUrlByParameter('url')
  var new_url = hostURL + 'services/context/metadata?url=' + url
  $.getJSON(new_url, (response) => {
    if ('type' in response) {
      var type = response.type
      $('#details').text(type)
      $('#url_details').show()
    }
  }).fail(() => {})
  var captures
  getWaybackCount(url, (total) => {
    captures = total
    $('#total_archives_number').attr('href', 'https://web.archive.org/web/*/' + url)
    .text(captures.toLocaleString())
    if (captures > 0) {
      $('#total_captures').show()
      get_thumbnail()
    } else {
      $('#loader_thumbnail').hide()
      $('#show_thumbnail').text('Thumbnail not found.')
    }
  })
}

function first_archive_details () {
  var url = getUrlByParameter('url')
  var new_url = hostURL + 'cdx/search?url=' + url + '&limit=1&output=json'
  $.getJSON(new_url, (data) => {
    if (data.length === 0) {
      $('#first_archive_datetime_error').text('Data not available')
    } else {
      const ts = data[1][1]
      const dt = timestampToDate(ts).toString().split('+')[0]
      $('#first_archive_datetime')
        .text(dt)
        .attr('href', 'https://web.archive.org/web/' + ts + '/' + url)
    }
  })
  .fail(() => $('#first_archive_datetime_error').text('Data not available'))
}

function recent_archive_details () {
  var url = getUrlByParameter('url')
  var new_url = hostURL + 'cdx/search?url=' + url + '&limit=-1&output=json'
  $.getJSON(new_url, (data) => {
    if (data.length === 0) {
      $('#recent_archive_datetime_error').text('Data not available')
    } else {
      const ts = data[1][1]
      const dt = timestampToDate(ts).toString().split('+')[0]
      $('#recent_archive_datetime')
      .text(dt)
      .attr('href', 'https://web.archive.org/web/' + ts + '/' + url)
    }
  })
  .fail(() => $('#recent_archive_datetime_error').text('Data not available'))
}
// Function used to get the thumbnail of the URL
function get_thumbnail () {
  var url = getUrlByParameter('url')
  var new_url = 'http://crawl-services.us.archive.org:8200/wayback?url=' + url + '&width=300&height=200'
  $('#loader_thumbnail').show()
  fetch(new_url)
    .then((response) => {
      $('#loader_thumbnail').hide()
      $('#show_thumbnail').append($('<img class="thumbnail-box">').attr('src', new_url))
    })
    .catch((exception) => {
      $('#loader_thumbnail').hide()
      if (exception === 'timeout') {
        $('#show_thumbnail').text('Please refresh the page.')
      } else {
        if (exception.status === 504) {
          $('#show_thumbnail').text('Please refresh the page.')
        } else {
          $('#show_thumbnail').text('Thumbnail not found.')
        }
      }
    })
}
