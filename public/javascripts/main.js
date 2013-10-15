var jobs = {}, filteredTasks = [];

$(document).ready( function (){
  
  if(events){
    
    $('input#start,input#end').datepicker();
    $('input#start').datepicker('option', 'defaultDate', -14);
    $('input#start,input#end,input#rate').on('change', dateSelect);

    $.each(events, function (){
      if(jobs[this.summary])
        jobs[this.summary].push(this);
      else
        jobs[this.summary] = [this];
    });

    // Loop through list of jobs
    $.each(jobs, function(key, value){
      $('#filter').append(
        // Make sure undefined jobs does not reach the list (cancelled events)
        key != 'undefined' ? $('<label><input type="checkbox" name="'+key+'" />'+key+'</label>') : null
      );
    });

    $('input[type="checkbox"').on('change', calculate);
  }

  // hide the raw documentation
  $('#raw').hide().on('blur', function(){$(this).hide()});
})

function addCommas(nStr)
{
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? ',' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)){
    x1 = x1.replace(rgx, '$1' + '.' + '$2');
  }
  return x1 + x2;
}

function getHours (time){
  return time / 60 / 60 / 1000;
}

function calculate (){
  // Reset counters and tasksContainers
  filteredTasks = [];

  // Loop through all checked rows
  $('input[type="checkbox"]').each(function (key){
    if($(this).is(':checked')){
      $.each(jobs[$(this).attr('name')], function (){
        var start = new Date(this.start.dateTime);
        var end =  new Date(this.end.dateTime);
        
        var timeframe = {
          start : $('#start').datepicker("getDate"),
          end : $('#end').datepicker("getDate")
        };

        var between = true;
        var pickerEndDate = new Date($('#end').datepicker("getDate"));

        pickerEndDate.setHours(23);
        pickerEndDate.setMinutes(59);

        console.log(this, '\n');

        if(start >= $('#start').datepicker("getDate") && end < pickerEndDate){
          addHours(start, end, this.summary, this.description);
        }
      });
    }
  });

  updateLabels();
  writeDocs();
}

function dateSelect (){
  calculate();
}

function addHours (start, end, title, description){
  // Date does not already exist in array
  var dateExists = false, hours = getHours(end - start);
  if(title == undefined) title = '';
  if(description == undefined) description = '';

  // Loop through filtered dates
  $(filteredTasks).each(function (){
    // Shortcut variable
    var d = this.start;
    // Calulate if a date that starts the same time exists in array
    if (d.getDate() == start.getDate() && d.getMonth() == start.getMonth() && d.getYear() == start.getYear()){
      // Add hours to current dates hours
      this.hours += hours;
      // Get single task and push it to array of tasks
      this.tasks.push( getTaskObject(start, end, description, hours) );
      // Close the loop
      return dateExists = true;
    }
  });

  // if no task in array had this exact date
  // create a new container to hold tasks on this date
  if (!dateExists){

    // create a tasksContainer and
    // push it to the filteredTasks array
    var tasksContainer = getTaskObject(start, end, title, 0, true);
    filteredTasks.push(tasksContainer);

    // add current task to the tasks container
    // since we just added it before it will be
    // put into the tasksContainer and use the
    // title as the summary instead
    addHours(start, end, title, description, hours);
  }
}

function writeDocs (){
  $('#formatted tbody').empty();

  $.each(filteredTasks, function(){
    // IMPLEMENT GET FORMATTED DATA
    $('#formatted tbody').append(getTaskRow(this));
    $(this.tasks).each(function (){
      $('#formatted tbody').append(getTaskRow(this, true));
    });
  });
}

function writeRawDocs (){

  var rawtext = '';

  $.each(filteredTasks, function(){

    // The data served in different formatted ways 
    var d1 = getFormattedData(this);

    // Add the date to the raw text
    rawtext += d1.date + " - ( ";

    // Loop through sub-tasks
    $(this.tasks).each(function (){
      var d2 = getFormattedData(this);

      // Add the hours to the raw text
      rawtext += d2.time + (d2.summary != '' ? ", " + (d2.summary) : '') + " / ";
    });

    rawtext = rawtext.replace(/ \/ +$/,'');
    rawtext += " ) - " + d1.hours + " timer" + "\n";

  });
  
  // Define size of textarea, set the text and show it
  $('#raw').css({width: $('#formatted').width(), height: $('#formatted').height()}).text(rawtext).show().focus().select();
}

function getTaskObject (start, end, summary, hours, isTasksContainer){
  // Create a tasksContainer
  var task = { start: start, end: end, summary: summary, hours: hours };
  // Is it the tasks tasksContainer?
  if(isTasksContainer) task.tasks = [];
  // Return it
  return task;
}

// This function needs to go, as soon as getFormattedData get's implemented
function getTaskRow (task, secondary){
  var timeframe = secondary ? getLeadingZeros(task.start.getHours()) +':'+ getLeadingZeros(task.start.getMinutes()) +' - '+ getLeadingZeros(task.end.getHours()) +':'+ getLeadingZeros(task.end.getMinutes()) : getLeadingZeros(task.start.getDate()) +'/'+ getLeadingZeros(task.start.getMonth()+1) +'/'+ task.start.getFullYear();
  return $('<tr'+(secondary ? ' style="color: #666; font-size: 11px;"': '')+'><td>'+ timeframe +'</td><td>'+ task.summary +'</td><td>'+ Math.round(task.hours*10)/10 +'</td></tr>')
}

// t = the task
function getFormattedData (t) {
  // Data object to return
  var d = {};
  // Set data values
  d.date = getLeadingZeros(t.start.getDate()) +'/'+ getLeadingZeros(t.start.getMonth()+1) +'/'+ t.start.getFullYear();
  d.time = getLeadingZeros(t.start.getHours()) +':'+ getLeadingZeros(t.start.getMinutes()) +' - '+ getLeadingZeros(t.end.getHours()) +':'+ getLeadingZeros(t.end.getMinutes());
  d.hours = t.hours;
  d.summary = t.summary;
  // Return data object
  return d;
}

function getLeadingZeros (number){
  return number < 10 ? '0' + number : number;
}

function updateLabels (){
  var hours = 0;
  $(filteredTasks).each( function () { hours += this.hours; });
  hours = Math.ceil(hours);

  $('#hours span').text(hours);
  $('#money span').text(addCommas(hours * $('#rate').val()));
}