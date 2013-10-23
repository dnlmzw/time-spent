// Initiating "Time-Spent" app
var ts = {
  jobs: {},
  filteredTasks: [],

  addCommas: function (nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? ',' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)){
      x1 = x1.replace(rgx, '$1' + '.' + '$2');
    }
    return x1 + x2;
  },

  getHours: function (time) {
    return time / 60 / 60 / 1000;
  },

  calculate: function () {
    // Reset counters and tasksContainers
    ts.filteredTasks = [];

    // Loop through all checked rows
    $('input[type="checkbox"]').each(function (key){
      if($(this).is(':checked')){
        $.each(ts.jobs[$(this).attr('name')], function (){
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
            ts.addHours(start, end, this.summary, this.description);
          }
        });
      }
    });

    ts.updateLabels();
    ts.writeDocs();
  },

  dateSelect: function () {
    ts.calculate();
  },

  addHours: function (start, end, title, description) {
    // Date does not already exist in array
    var dateExists = false, hours = ts.getHours(end - start);
    if(title == undefined) title = '';
    if(description == undefined) description = '';

    // Loop through filtered dates
    $(ts.filteredTasks).each(function (){
      // Shortcut variable
      var d = this.start;
      // Calulate if a date that starts the same time exists in array
      if (d.getDate() == start.getDate() && d.getMonth() == start.getMonth() && d.getYear() == start.getYear()){
        // Add hours to current dates hours
        this.hours += hours;
        // Get single task and push it to array of tasks
        this.tasks.push( ts.getTaskObject(start, end, description, hours) );
        // Close the loop
        return dateExists = true;
      }
    });

    // if no task in array had this exact date
    // create a new container to hold tasks on this date
    if (!dateExists){

      // create a tasksContainer and
      // push it to the ts.filteredTasks array
      var tasksContainer = ts.getTaskObject(start, end, title, 0, true);
      ts.filteredTasks.push(tasksContainer);

      // add current task to the tasks container
      // since we just added it before it will be
      // put into the tasksContainer and use the
      // title as the summary instead
      ts.addHours(start, end, title, description, hours);
    }
  },

  writeDocs: function () {
    $('#formatted tbody').empty();

    $.each(ts.filteredTasks, function(){
      // IMPLEMENT GET FORMATTED DATA
      $('#formatted tbody').append(ts.getTaskRow(this));
      $(this.tasks).each(function (){
        $('#formatted tbody').append(ts.getTaskRow(this, true));
      });
    });
  },

  writeRawDocs: function () {

    var rawtext = '';

    $.each(ts.filteredTasks, function(){

      // The data served in different formatted ways 
      var d1 = ts.getFormattedData(this);

      // Add the date to the raw text
      rawtext += d1.date + " - ( ";

      // Loop through sub-tasks
      $(this.tasks).each(function (){
        var d2 = ts.getFormattedData(this);

        // Add the hours to the raw text
        rawtext += d2.time + (d2.summary != '' ? ", " + (d2.summary) : '') + " / ";
      });

      rawtext = rawtext.replace(/ \/ +$/,'');
      rawtext += " ) - " + d1.hours + " timer" + "\n";

    });
    
    // Define size of textarea, set the text and show it
    $('#raw').css({width: $('#formatted').width(), height: $('#formatted').height()}).text(rawtext).show().focus().select();
  },

  getTaskObject: function (start, end, summary, hours, isTasksContainer) {
    // Create a tasksContainer
    var task = { start: start, end: end, summary: summary, hours: hours };
    // Is it the tasks tasksContainer?
    if(isTasksContainer) task.tasks = [];
    // Return it
    return task;
  },

  // This function needs to go, as soon as getFormattedData get's implemented
  getTaskRow: function (task, secondary) {
    var timeframe = secondary ? ts.getLeadingZeros(task.start.getHours()) +':'+ ts.getLeadingZeros(task.start.getMinutes()) +' - '+ ts.getLeadingZeros(task.end.getHours()) +':'+ ts.getLeadingZeros(task.end.getMinutes()) : ts.getLeadingZeros(task.start.getDate()) +'/'+ ts.getLeadingZeros(task.start.getMonth()+1) +'/'+ task.start.getFullYear();
    return $('<tr'+(secondary ? ' style="color: #666; font-size: 11px;"': '')+'><td>'+ timeframe +'</td><td>'+ task.summary +'</td><td>'+ Math.round(task.hours*10)/10 +'</td></tr>')
  },

  // t = the task
  getFormattedData: function (t) {
    // Data object to return
    var d = {};
    // Set data values
    d.date = ts.getLeadingZeros(t.start.getDate()) +'/'+ ts.getLeadingZeros(t.start.getMonth()+1) +'/'+ t.start.getFullYear();
    d.time = ts.getLeadingZeros(t.start.getHours()) +':'+ ts.getLeadingZeros(t.start.getMinutes()) +' - '+ ts.getLeadingZeros(t.end.getHours()) +':'+ ts.getLeadingZeros(t.end.getMinutes());
    d.hours = t.hours;
    d.summary = t.summary;
    // Return data object
    return d;
  },

  getLeadingZeros: function (number) {
    return number < 10 ? '0' + number : number;
  },

  updateLabels: function () {
    var hours = 0;
    $(ts.filteredTasks).each( function () { hours += this.hours; });
    hours = Math.ceil(hours);

    $('#hours span').text(hours);
    $('#money span').text(ts.addCommas(hours * $('#rate').val()));
  }

}

$(document).ready( function (){
  
  if(events){
    
    $('input#start,input#end').datepicker();
    $('input#start').datepicker('option', 'defaultDate', -14);
    $('input#start,input#end,input#rate').on('change', ts.dateSelect);

    $.each(events, function (){
      if(ts.jobs[this.summary])
        ts.jobs[this.summary].push(this);
      else
        ts.jobs[this.summary] = [this];
    });

    // Loop through list of ts.jobs
    $.each(ts.jobs, function(key, value){
      $('#filter').append(
        // Make sure undefined ts.jobs does not reach the list (cancelled events)
        key != 'undefined' ? $('<label><input type="checkbox" name="'+key+'" />'+key+'</label>') : null
      );
    });

    $('input[type="checkbox"').on('change', ts.calculate);
  }

  // hide the raw documentation
  $('#raw').hide().on('blur', function(){$(this).hide()});
});