
// Define margins 
var margin = {top: 20, right: 20, bottom: 30, left: 50},
width = parseInt(d3.select('#chart').style('width')) - margin.left - margin.right,
height = parseInt(d3.select('#chart').style('height')) - margin.top - margin.bottom;

var yMax = 28000;

// Define scales
var xScale = d3.scaleLinear().range([0, width]);
var yScale = d3.scaleLinear().range([height, 0]);
var color = d3.scaleOrdinal()
      .range(['#FABE9C', '#F6AB9A', '#FED47D']);

var categories, xLabel, data;

// Define axes
var xAxis = d3.axisBottom(xScale).tickFormat(d3.format('d'));
var yAxis = d3.axisLeft(yScale).tickSize(width).tickSize(-width, 0, 0);

// Define lines
var line = d3.line().curve(d3.curveBasis)
            .x(function(d) { return xScale(d['date']); })
            .y(function(d) { return yScale(d['concentration']); });

// Define svg canvas
var totalHeight = height + margin.top + margin.bottom;
var categoryLine, tipBox, concentrations;
var svg = d3.select('#chart')
            .style('width', width + margin.left + margin.right)
            .style('height', totalHeight)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

var tooltip = d3.select('#tooltip');
var tooltipLine;

var removeTooltip = function () {
    if (tooltip) tooltip.style('display', 'none');
    if (tooltipLine) tooltipLine.attr('stroke', 'none');
    d3.selectAll('circle').style('display', 'none');
}

var drawTooltip = function () {
    var x0 = xScale.invert(d3.mouse(tipBox.node())[0]),
    xData = Math.floor(x0),
    hoverAllData = {};

    // Get all related data
    concentrations.forEach(function (item) {
      var catData = _.find(item.datapoints, { 'date': ''+xData })
      if (catData) {
        hoverAllData[item.category] = catData;
      }
    })

    // Hide/show circle
    d3.selectAll('circle').style('display', 'none');
    d3.selectAll('.circle-'+xData).style('display', 'block');
    
    // Placing of tooltip  
    var yCoor = (parseInt(d3.select('.chart-info').style('height')) - height - margin.top - margin.bottom) + d3.mouse(this)[1]
    
    // Reposition line
    tooltipLine.attr('stroke', '#bdbdbd')
      .attr('x1', xScale(xData))
      .attr('x2', xScale(xData))
      .attr('y1', 0)
      .attr('y2', height);
    
    // Display info
    tooltip.html("<div>"+xData+"</div>")
      .style('display', 'block')
      .style('font-weight', 'bold')
      .style('left', (d3.mouse(tipBox.node())[0] + margin.left + margin.right) + 'px')
      .style('top', yCoor + 'px');

    // Add class same as the legends
    tooltip.append('ul')
      .attr('class', 'legends-list');

    // Display hover data
    _.each(hoverAllData, function(category, index) {
      if (!category.isDisabled) {
        var liHtml = "<div class='title inline-b'>"+
            index+"</div> <div class='desc inline-b'>"+category.concentration+"</div>"
        var li = tooltip.select('ul').append('li')
          .attr('class', 'col-4')
          .style('color', function(d) {return color(index); });
        
        li.html(liHtml); 
      }
    })

}

// Sort category legend and recalculate data again for the shown legends
var sortCategoryLegend = function () {
  categories.map(function(category, index){
    // Draw legend list
    var li = legends.append('li')
      .attr('class', 'col-4 ' + (category.isDisabled ? 'exclude' : ''))
      .style('color', function(d) {return color(category.name); })
      .html("<span class='default-color'>"+category.name+"</span>")
      .on('click', function(d) {
        category.isDisabled = !category.isDisabled;
        categories = _.sortBy(categories, [function(o) { return o.isDisabled; }]);
        legends.html('');
        sortCategoryLegend();

        // Redraw graph since a category is disabled
        concentrations = categories.map(function(category, index){
          if (!category.isDisabled) {
            return {category: category.name, datapoints: data.map(function(d){
              return {date: d[xLabel], concentration: +d[category.name]}
            })}
          }
        })
        // Remove falsy values of legends
        concentrations = _.compact(concentrations);
        svg.html('');

        drawGraph();

      });
  })
}

var legends = d3.select('#legends ul');

// Read in data
d3.csv('./assets/data/milledRiceEndingStocks.csv', function(error, csvdata){
  if (error) throw error;
  data = csvdata;

  // Get the first key name for y axis
  xLabel = d3.keys(data[0])[0];

  // Set the color domain equal to the three categories
  categories = d3.keys(data[0]).slice(1)
  color.domain(categories);

  // Reformat data to make it more copasetic for d3
  // data = An array of objects
  // concentrations = An array of three objects, each of which contains an array of objects
  // Set the legends
  concentrations = categories.map(function(category, index){
    categories[index] = { name: category, isDisabled: false}
    legends.html('');
    sortCategoryLegend();

    return {category: category, datapoints: data.map(function(d){
      return {date: d[xLabel], concentration: +d[category]}
    })}
  })

  drawGraph();

});

function drawGraph () {
  // Set the domain of the axes
  xScale.domain(d3.extent(data, function(d) { return d[xLabel]; }));
  yScale.domain([
    d3.min(concentrations, function(c) { return d3.min(c.datapoints, function(v) { return v.concentration; }); }),
    d3.max(concentrations, function(c) { return d3.max(c.datapoints, function(v) { return v.concentration; }); })
  ]);

  // Place the axes on the chart
  svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + (height) + ')')
      .call(xAxis)
      .selectAll('text')
      .attr('y', 10);
      // .attr('x', 6)
      // .style('text-anchor', 'start');

  svg.append('g')
      .attr('class', 'y axis')
      .transition().duration(500)
      .call(yAxis)
      .on('end', function() {
        d3.select(this).append('text')
        .attr('class', 'label')
        .attr('y', -10)
        // .attr('dy', '.71em')
        // .attr('dx', '-1em')
        .attr('fill', '#333333')
        .style('text-anchor', 'end')
        .text('Production');
      });  

  // Realign y ticks
  svg.selectAll('.y.axis text').attr('dy', -4);

  // Draw tooltip vertical line in hover
  tooltipLine = svg.append('line');

  // Draw toolip box
  tipBox = svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('opacity', 0)
      .on('mousemove', drawTooltip)
      .on('mouseout', removeTooltip);


  // Draw the graph
  categoryLine = svg.selectAll('.category')
      .data(concentrations)
      .enter().append('g')
      .attr('class', 'category');
  
  // Draw each path
  var catPath = categoryLine.append('path')
      .attr('class', 'line')
      .attr('d', function(d) { return line(d.datapoints); })
      .attr('stroke-width', '2px')
      .attr('fill', 'none')
      .attr('stroke', function(d) {return color(d.category); })
      .on('mouseover', function(d) { 
        // on mouse in show line, circles and text
        d3.select(this).style('stroke-width', '3px');
      })
      .on('mousemove', drawTooltip)
      .on('mouseout', function() { 
        d3.select(this).style('stroke-width', '2px');
      });

  // Animate path
  catPath.each(function(d) { d.totalLength = this.getTotalLength(); })
      .attr("stroke-dasharray", function(d) { return d.totalLength + " " + d.totalLength; })
      .attr("stroke-dashoffset", function(d) { return d.totalLength; })
      .transition()
      .duration(500)
      .attr("stroke-dashoffset", 0);

  // Draw joint line cirlce
  categoryLine.append('g').selectAll('circle')
      .data(function(d){ return d.datapoints })
      .enter()
      .append('circle')
      // Add unique class to hide/show on hover
      .attr('class', function(dd){return 'circle-' + dd.date})
      .attr('r', 2)
      .attr('cx', function(dd){return xScale(dd.date)})
      .attr('cy', function(dd){return yScale(dd.concentration)})
      .attr('fill', function(d) {return color(d.category); })
      .style('stroke', function(d) {return color(d.category); })
      .style('display', 'none');

}



// Define responsive behavior
function resize () {
  // Resize chart
  var chartContainerWidth = parseInt(d3.select('.chart-info').style('width')) * .83
  d3.selectAll('#chart').transition()
      .style('width', chartContainerWidth)
      .duration(100)
      .delay(200)
      .on('end', adjust );
}

// Addjust Graph
function adjust() {
  // Get the new size
  width = parseInt(d3.select('#chart').style('width')) - margin.left - margin.right;
  height = parseInt(d3.select('#chart').style('height')) - margin.top - margin.bottom;

  // Update the range of the scale with new width/height and the ticksize gap
  xScale.range([0, width]);
  yScale.range([height, 0]);

  yAxis.tickSize(-width, 0, 0);

  // Update the axis and text with the new scale
  svg.select('.x.axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);

  svg.select('.y.axis')
    .call(yAxis);

  // Force D3 to recalculate and update the line
  svg.selectAll('.line')
    .attr('d', function(d) { return line(d.datapoints); });

  // Update circle point
  svg.selectAll('circle')
      .attr('cx', function(dd){return xScale(dd.date)})
      .attr('cy', function(dd){return yScale(dd.concentration)});

  // Update Rectangle for mouse event
  svg.selectAll('rect')
      .attr('width', width)
      .attr('height', height);

  // Update the tick marks
  xAxis.ticks(Math.floor(Math.max(width/65, 4)));
  yAxis.ticks(Math.floor(Math.max(height/30, 4)));

};


// Call the resize function whenever a resize event occurs
d3.select(window).on('resize',  resize );

// Call the resize function
adjust();