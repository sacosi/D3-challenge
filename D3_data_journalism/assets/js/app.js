// Starting with the function to make the chart responsive
function makeResponsive() {

  // Looking for the svg svgArea, if there is one remove it
  var svgArea = d3.select("body").select("svg");
  if (!svgArea.empty()) {
    svgArea.remove();
  }

  // svg width is the size of the parent container and height is the (size of window - (size of window/2.5))
  var svgWidth = $('#scatter').width();
  var svgHeight = window.innerHeight-window.innerHeight/2.5;

  // chart margins. left and bottom margins are higher to accomodate the axis' labels
  var margin = {
    top: 20,
    right: 20,
    bottom: 120,
    left: 100
  };

  //chart area. Basically it's the svg area - the margins
  var chartWidth = svgWidth - margin.left - margin.right;
  var chartHeight = svgHeight - margin.top - margin.bottom;

  //Creating the svg area
  var svg = d3.select("#scatter")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  
  //Creating a group for the chart
  var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  //Creating 2 object for the x and y axis to use later on
  yAxisIds = {
    "obesity": "Obesity (%)",
    "smokes": "Smokes (%)",
    "healthcare": "Lacks Healthcare (%)"
  }
  xAxisIds = {
    "poverty": "In Poverty (%)",
    "age": "Age (Median)",
    "income": "Household Income (Median)"
  }

  //Reading the data from the csv file
  d3.csv("assets/data/data.csv").then(function (data) {

    //type casting the data to floats
    data.forEach(element => {
      element.age = +element.age
      element.healthcare = +element.healthcare
      element.income = +element.income
      element.obesity = +element.obesity
      element.poverty = +element.poverty
      element.smokes = +element.smokes
    });

    //Creating both x and y scale
    var xScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.poverty) - 1, d3.max(data, d => d.poverty) + 2])
      .range([0, chartWidth]);
    var yScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.healthcare) - 1, d3.max(data, d => d.healthcare) + 2])
      .range([chartHeight, 0]);

    //Creating the variables for the chart's axis
    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);

    //Creating another g element for each of the axis and calling the functions stored in the variables in the prior step
    chartGroup.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .classed("xAxis", true)
      .call(xAxis);
    chartGroup.append("g")
      .classed("yAxis", true)
      .call(yAxis)

    //Creating the circles
    var circles = chartGroup.selectAll(".stateCircle")
      .data(data)
      .enter()
      .append("circle")
      .classed("stateCircle", true)
      .attr("cx", d => xScale(d.poverty))
      .attr("cy", d => yScale(d.healthcare))
      .attr("r", "15")
      .attr("opacity", "0.8")

    //Creating the circles' text
    var circlesText = chartGroup.selectAll(".stateText")
      .data(data)
      .enter()
      .append("text")
      .classed("stateText", true)
      .attr("x", d => xScale(d.poverty))
      .attr("y", d => yScale(d.healthcare) + 3)
      .text(d => d.abbr);

    //Creating the tooltip
    var toolTip = d3.tip()
      .attr("class", "d3-tip")
      .offset([70, -50])
      .html(function (d) {
        return (`<strong>${d.state}</strong><br> Healthcare: ${d.healthcare}<br> Poverty: ${d.poverty}`);
      });
    chartGroup.call(toolTip);

    //Want the tooltip to be active when hovering over the circles and the text
    circles.on("mouseover", function (data) {
      toolTip.show(data, this);
    })
      .on("mouseout", function (data, index) {
        toolTip.hide(data);
      });

    circlesText.on("mouseover", function (data) {
      toolTip.show(data, this);
    })
      .on("mouseout", function (data, index) {
        toolTip.hide(data);
      });

    
    // Creating the y axes labels
    var yAxisLabels = chartGroup.append("g")
      .classed("yAxisLabels", true)
      .classed("aText", true)

    // looping through the object created before to create each of the 3 axis with its key and value
    var i = 0
    Object.entries(yAxisIds).forEach(function ([key, value]) {
      yAxisLabels.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + (i * 25))
        .attr("x", 0 - (chartHeight / 2))
        .attr("dy", "1em")
        .attr("class", "axisText  inactive")
        .attr("id", key)
        .text(value);
      i++
    });
    //Making healthcare as the active axis label
    d3.select("#healthcare").attr("class", "axisText active")

    //Creating the x axes labels
    var xAxisLabels = chartGroup.append("g")
      .classed("xAxisLabels", true)
      .classed("aText", true)

    // looping through the object created before to create each of the 3 axis with its key and value
    var i = 0
    Object.entries(xAxisIds).forEach(function ([key, value]) {
      xAxisLabels.append("text")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + margin.top + 20 + (i * 25)})`)
        .attr("class", "axisText inactive")
        .attr("id", key)
        .text(value);
      i++
    });

    //Making poverty as the active axis label
    d3.select("#poverty").attr("class", "axisText active")

    //When clicking on each of the labels call either function updateX or updateY 
    xAxisLabels.selectAll("text").on("click", updateX)
    yAxisLabels.selectAll("text").on("click", updateY)


    //function called when the user clicks on an x axis
    function updateX() {

      //Create a variable for the id of the axis the user clicked on
      var newX = d3.select(this).attr("id");
      //Find out what is the active y axis to later use in the tooltip
      var activeY = d3.select(".yAxisLabels").select(".active").attr("id");

      //Update the scale of the x axis for the new measure
      var xScale = d3.scaleLinear()
        .domain([d3.min(data, d => d[newX]) - (d3.min(data, d => d[newX]) / 20), d3.max(data, d => d[newX]) + 2])
        .range([0, chartWidth]);

      var xAxis = d3.axisBottom(xScale);

      d3.select(".xAxis").call(xAxis);

      //For the circles we need to update its x position
      d3.selectAll("circle")
        .data(data)
        .attr("cx", d => xScale(d[newX]));

      //We also need to update the x position of the state text 
      d3.selectAll(".stateText")
        .data(data)
        .attr("x", d => xScale(d[newX]))

      //Make all the labels inactive (just to reset and make them all unbold so I can in the next step set the one clicked bold)
      d3.select(".xAxisLabels").selectAll("text").each(function (d, i) {
        d3.select(this).classed("active", false).classed("inactive", true)
      })

      //Make the axis selected active
      d3.select(this).classed("active", true).classed("inactive", false)

      //Update the tooltip with the new x and the active y
      toolTip.html(function (d) {
        return (`<strong>${d.state}</strong><br>${activeY}: ${d[activeY]}<br>${newX}: ${d[newX]}`);
      });

      chartGroup.call(toolTip);

    };

    //function called when the user clicks on an x axis
    function updateY() {

      //Create a variable for the id of the axis the user clicked on
      var newY = d3.select(this).attr("id");

      //Find out what is the active x axis to later use in the tooltip
      var activeX = d3.select(".xAxisLabels").select(".active").attr("id");

      //Update the scale of the y axis for the new measure
      var yScale = d3.scaleLinear()
        .domain([d3.min(data, d => d[newY]) - 1, d3.max(data, d => d[newY]) + 2])
        .range([chartHeight, 0]);

      var yAxis = d3.axisLeft(yScale);

      d3.select(".yAxis").call(yAxis);

      //For the circles we need to update its y position
      d3.selectAll("circle")
        .data(data)
        .attr("cy", d => yScale(d[newY]));

      //We also need to update the y position of the state text 
      d3.selectAll(".stateText")
        .data(data)
        .attr("y", d => yScale(d[newY]) + 3)

      //Make all the labels inactive (just to reset and make them all unbold so I can in the next step set the one clicked bold)
      d3.select(".yAxisLabels").selectAll("text").each(function (d, i) {
        d3.select(this).classed("active", false).classed("inactive", true)
      })

      //Make the axis selected active
      d3.select(this).classed("active", true).classed("inactive", false)

      //Update the tooltip with the new y and the active x
      toolTip.html(function (d) {
        return (`<strong>${d.state}</strong><br>${newY}: ${d[newY]}<br>${activeX}: ${d[activeX]}`);
      });

      chartGroup.call(toolTip);

    };

  });
};

//Initial call of the make response function
makeResponsive();

//Call the makeResponsive function everytime the window is resized
d3.select(window).on("resize", makeResponsive);