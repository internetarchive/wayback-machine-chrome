// domaintools.js

// from 'utils.js'
/*   global getUrlByParameter */

function appendToParent (id, item, text_before, parent, show_item, text_after) {
  if (item) {
    if (show_item) {
      parent.append($(id).text(text_before + item + text_after))
    } else {
      parent.append($(id).text(text_before + text_after))
    }
  }
}
function get_domainTool () {
  var url = getUrlByParameter('url')
  var domaintools_api = hostURL+'context/domaintools?url=' + url
  $.getJSON(domaintools_api, function (data) {
    var parent = $('#show_domaintools_data')
    if (data.status !== 'error') {
      if (data.response.results_count !== 0) {
        appendToParent('#domain', data.response.results[0].domain, 'Domain: ', parent, true, '')
        appendToParent('#alexa', data.response.results[0].alexa, 'Alexa Rank: ', parent, true, '')
        appendToParent('#admin_contact_country', data.response.results[0].admin_contact.country.value, 'Country: ', parent, true, '')
        appendToParent('#create_date', data.response.results[0].create_date.value, 'Created Date: ', parent, true, '')
        appendToParent('#email_domain', data.response.results[0].email_domain[0].value, 'Email Domain: ', parent, true, '')
        appendToParent('#expiration_date', data.response.results[0].expiration_date.value, 'Expire Date: ', parent, true, '')
        appendToParent('#admin_contact_state', data.response.results[0].admin_contact.state.value, 'State: ', parent, true, '')
        appendToParent('#registrant_org', data.response.results[0].registrant_org.value, 'Registrant Org: ', parent, true, '')
        appendToParent('#website_response', data.response.results[0].website_response, 'Website Response Status Code: ', parent, true, '')
        appendToParent('#whois', data.response.results[0].whois_url, 'Click to see the Whois URL', parent, false, '')
        $('#whois').attr('href', data.response.results[0].whois_url)
      } else {
        parent.text('No data found!!')
      }
    } else {
      parent.text('No data found!!')
    }
    $('#loader_domaintools').hide()
    $('#show_domaintools_data').show()
  })
  .fail(function() {
    parent.text('No data found!!')
  })
}
if (typeof module !== 'undefined') { module.exports = { appendToParent: appendToParent } }
