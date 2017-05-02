function initBubbleChart(csvURI) {
  var svg = d3.select("#bubble-chart"),
      width = +svg.attr("width"),
      height = +svg.attr("height");

  var format = d3.format(",d");

  var color = d3.scaleOrdinal(d3.schemeCategory20c);

  var pack = d3.pack()
              .size([width, height])
              .padding(1.5);

  var x = d3.scaleBand()
    .range([0, width])
    .round(.1);

  d3.csv(csvURI, function(d) {
    d.value = +d.value;
    if (d.value) return d;
  }, function(error, classes) {
    if (error) throw error;

    var root = d3.hierarchy({children: classes})
                .sum(function(d) { return d.value; })
                .each(function(d) {
                  if (id = d.data.id) {
                    var id, i = id.lastIndexOf(".");
                    d.id = id;
                    d.package = id.slice(0, i);
                    var j = id.indexOf(".");
                    d.position = id.slice(j + 1, i);
                    console.log("Position:");
                    console.log(d.position);
                    d.class = id.slice(i + 1);
                    d.classnposition = d.class + " " + d.position;
                  }
                });

    var node = svg.selectAll(".node")
                  .data(pack(root).leaves())
                  .enter().append("g")
                  .attr("class", "node")
                  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                  .on('mousemove', function(d) {
                    this.style.opacity = 0.7;
                    var re = new RegExp('^' + d.package + '.*');
                    d3.selectAll('.node').style('transition', '.5s').style('opacity', function (d) {
                      if (re.test(d.id)) { return 1; } else { d3.select(this).selectAll('text').style('opacity', 0); return 0.5; }
                    });
                    tooltip.html(fillTooltip(d))
                           .style('display', 'inline')
                           .style('left', (d3.event.pageX + 10) + 'px')
                           .style('top', (d3.event.pageY + 10) + 'px');
                  })
                  .on('mouseout', function() {
                    d3.select(this).style('opacity', 1);
                    d3.selectAll('.node').style('opacity', 1);
                    d3.selectAll('text').style('opacity', 1);
                    tooltip.style('display', 'none');
                  })

    node.append("circle")
        .attr("id", function(d) { return d.id; })
        .attr("r", function(d) { return d.r; })
        .style("fill", function(d) { return color(d.package); });

    node.append("clipPath")
        .attr("id", function(d) { return "clip-" + d.id; })
        .append("use")
        .attr("xlink:href", function(d) { return "#" + d.id; });

    node.append("text")
        .attr("clip-path", function(d) { return "url(#clip-" + d.id + ")"; })
        .attr("text-anchor", "middle")
        .text(function(d) { return d.class; })
        .style("font-size", function(d, i, nodes) { return d.r / 2 + "px";});
    node.append("text")
        .attr("clip-path", function(d) { return "url(#clip-" + d.id + ")"; })
        .attr("text-anchor", "middle")
        // hard-coded by natalie
        .attr("dy", function(d) {if(d.r > 40) return d.r / 40; else if(d.r > 30) return d.r / 30; else return d.r / 20;})
        .text(function(d) { return d.position; })
        .style("font-size", function(d) { if(d.r > 40) return "11px"; else if(d.r > 30) return "8px"; else return d.r / 4 + "px";})
        .call(wrap, x.bandwidth());
  });
}

// http://stackoverflow.com/questions/24784302/wrapping-text-in-d3
function wrap(text, width) {
  text.each(function(d) {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      console.log(word);
      console.log(d.r);
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > d.r * 1.75) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", 0).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

function updateBubbleChart (value) {
  d3.selectAll('.node').remove();
  initBubbleChart(dataList[value]);
}

function fillTooltip (d) {
  var html = '';
  
  // SCHOOL NAME
  html += "<div class='left'><h1><b><u>";
  switch (d.class) {
    case 'ucla': html += 'UC Los Angeles'; break;
    case 'ucb': html += 'UC Berkeley'; break;
    case 'ucm': html += 'UC Merced'; break;
    case 'ucsd': html += 'UC San Diego'; break;
    case 'ucsb': html += 'UC Santa Barbara'; break;
    case 'ucsf': html += 'UC San Francisco'; break;
    case 'ucd': html += 'UC Davis'; break;
    case 'ucsc': html += 'UC Santa Cruz'; break;
    case 'uci': html += 'UC Irvine'; break;
    case 'ucr': html += 'UC Riverside'; break;
  }
  html += '</u></b></h1>';

  // PACKAGE
  html += "<p>";
  html += d.package.split('.')[1];
  html += '</p>';
  
  // NUMBER OF PEOPLE
  var numberOfPeople = +d.value;
  html += '<p>';
  html += numberOfPeople + ' People'
  html += '</p></div>';
  
  // PERCENTAGE
  html += "<div class='right'><span class='percentage'>"
  var totalPeopleInClass = 0;
  d.parent.children.forEach(function(d) {
    totalPeopleInClass += (+d.data.value);
  });
  html += Math.round(((numberOfPeople / totalPeopleInClass)*100)*10)/10 + '%';
  html += '</span></div>'

  return html;
}