var jobs = {};

$(document).ready( function() {
  if(events) {
    
    $('input#start,input#end').datepicker();
    $('input#start').datepicker('option', 'defaultDate', -14);
    $('input#start,input#end,input#rate').on('change', dateSelect);

    $.each(events, function (){
      if(jobs[this.summary])
        jobs[this.summary].push(this);
      else
        jobs[this.summary] = [this];
    });

    $.each(jobs, function(key, value){
      $('#filter').append(
        $('<label><input type="checkbox" name="'+key+'" />'+key+'</label>')
      );
    });

    $('input[type="checkbox"').on('change', calculate);
  }
})

function addCommas(nStr)
{
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? ',' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + '.' + '$2');
  }
  return x1 + x2;
}

function getHours (time) {
  return time / 60 / 60 / 1000;
}

function calculate () {
  var hoursTotal = 0;
  var filtered = [];

  $('input[type="checkbox"]').each(function (key) {
    if($(this).is(':checked')){
      $.each(jobs[$(this).attr('name')], function () {
        var start = new Date(this.start.dateTime);
        var end =  new Date(this.end.dateTime);
        var hours = getHours(end - start)
        
        var timeframe = {
          start : $('#start').datepicker("getDate"),
          end : $('#end').datepicker("getDate")
        };

        var between = true;
        var pickerEndDate = new Date($('#end').datepicker("getDate"));

        pickerEndDate.setHours(23);
        pickerEndDate.setMinutes(59);

        if(start >= $('#start').datepicker("getDate") && end < pickerEndDate){
          console.log(this.summary)
          filtered.push({ date: start, summary: this.summary, hours: hours });
          hoursTotal += hours;
        }
      });
    }
  });

  writeDocumentation(filtered);
  setLabels(hoursTotal);
}

function dateSelect (){
  calculate();
}

function writeDocumentation (filtered) {
  $('#documentation tbody').empty();

  $.each(filtered, function(){
    $('#documentation tbody').append(
      $('<tr><td>'+this.date.getDate()+'/'+(this.date.getMonth()+1)+'/'+this.date.getFullYear()+'</td><td>'+this.summary+'</td><td>'+this.hours+'</td></tr>')
    );
  });
}

function setLabels (hours) {
  hours = Math.ceil(hours);
  $('#hours span').text(hours);
  $('#money span').text(addCommas(hours * $('#rate').val()));
}