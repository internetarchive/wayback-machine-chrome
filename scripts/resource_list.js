window.onload = function () {
    var url = new URL(window.location.href)
    var tab_id = url.searchParams.get('job_id')
    var url_name = url.searchParams.get('url')
    show_resource_data(tab_id,url_name)
  }

  async function show_resource_data(job_id,url_name) {
    let vdata = {}
    let status = 'start'
    let resource_list_data = new Set()
    let old_resource_length = 0;
    const val_data = new URLSearchParams()
    val_data.append('job_id', job_id)
    $('#current-url').append(url_name+'.....')
    chrome.runtime.onMessage.addListener(
      function(message) {
        if (message.message == 'resource_list_show'){
          console.log(message.data)
        }
      }
    )
    while ((status === 'start') || (status === 'pending')) {
      var dom_status = document.getElementById('current-status')
      dom_status.innerHTML = 'Pending'
      // update UI
      var new_resource_length
      if ('resources' in vdata){
        new_resource_length = vdata.resources.length
        vdata.resources.forEach( (element) => {
          resource_list_data.add(element)
        });
      }
      if(new_resource_length>old_resource_length){
        old_resource_length = new_resource_length
        console.log("hey")
        for (let item of resource_list_data){
          $('#resource-list-container').append(
            $('<p>').append(item)
          );   
        }
      }
      console.log(resource_list_data)
      await sleep(1000)
      const timeoutPromise = new Promise(function (resolve, reject) {
        setTimeout(() => {
          reject(new Error('timeout'))
        }, 30000)
        if ((status === 'start') || (status === 'pending')) {
          fetch('https://web.archive.org/save/status', {
            credentials: 'include',
            method: 'POST',
            body: val_data,
            headers: {
              'Accept': 'application/json'
            }
          }).then(resolve, reject)
        }
      })
      timeoutPromise
        .then(response => response.json())
        .then(function(data) {
          status = data.status
          vdata = data
        })
        .catch((err)=>{
        })
    }
  
    if (vdata.status === 'success') {
      dom_status.innerHTML = 'Success'
      $(".text-right").show();
      new_resource_length = vdata.resources.length
      $("#spn-elements-counter").append(new_resource_length)
      vdata.resources.forEach( (element) => {
        resource_list_data.add(element)
      });
      if(new_resource_length>old_resource_length){
        old_resource_length = new_resource_length
        for (let item of resource_list_data){
          $('#resource-list-container').append(
            $('<p>').append(item)
          );   
        }
      }
      // update UI
    } else if (!vdata.status || (status === 'error')) {
      dom_status.innerHTML = 'Failed'
      // update UI
    }
  }
  