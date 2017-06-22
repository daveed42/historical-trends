var CanvasChart = function () {
    var ctx;
    var margin = { top: 0, left: 0, right: 0, bottom: 0 };
    var chartHeight, chartWidth, yMax, xMax, data;
    var maxYValue = 0;
    var ratio = 0;
    var count = 0;
    var overallMax, overallMin;
    var newData = []
    var renderType = { bars: 'bars', points: 'points', lines: 'lines' };

    var render = function(canvasId, dataObj) {
        data = dataObj;
        for (var i = 0; i < data.dataPoints.length; i++)
        {
            newData[i] = data.dataPoints[i].data.map(makeDate);
            newData[i].sort(function(a, b){return a.x - b.x});
        }
        console.log(newData);
        getMaxDataYValue();
        var canvas = document.getElementById(canvasId);
        chartHeight = 100; //canvas.getAttribute('height'); //100
        chartWidth = canvas.getAttribute('width');
        xMax = chartWidth - (margin.left + margin.right);
        yMax = chartHeight - (margin.top + margin.bottom);
        ratio = yMax / maxYValue;
        ctx = canvas.getContext("2d");
        renderChart();
        doStuff();
    }

    var makeDate = function (data) {
        data.x = new Date(data.x);
        return data;
    }

    var renderChart = function () {
        var overallMaxAndMin = getOverallMaxAndMin();
        var offsetAndWidth;
        for (let i = 0; i < data.dataPoints.length; i++)
        {
            ctx.save();
            translateLines();
            renderLines();
            renderName(i);
            ctx.save();
            offsetAndWidth = getOffsetAndWidth(overallMaxAndMin.min, overallMaxAndMin.max, newData[i][0].x, newData[i][newData[i].length-1].x);
            translateNewChart(offsetAndWidth.offset);
            //render data
            if (data.dataPoints[i].code == 1)
            {
                renderData(newData[i], i, offsetAndWidth.offset, offsetAndWidth.width, overallMaxAndMin.max, overallMaxAndMin.min);
            }
            ctx.restore();
            ctx.restore();
        }


        //render data based upon type of renderType(s) that client supplies
        /*if (data.renderTypes == undefined || data.renderTypes == null) data.renderTypes = [renderType.points];
        for (var i = 0; i < data.renderTypes.length; i++) {
            renderData(data.renderTypes[i]);
        }*/
    }

    var renderName = function (i)
    {
        ctx.save();
        ctx.font = data.labelFont;
        ctx.textAlign = 'left';
        ctx.fillText(data.dataPoints[i].title, 5, 12);
        ctx.restore();
    }

    var getMaxDataYValue = function () {
        for (let i = 0; i < newData.length; i++) {
            if (newData[i].y > maxYValue) maxYValue = newData[i].y;
        }
    };

    var getOverallMaxAndMin = function()
    {
        var max = newData[0][newData[0].length-1].x;
        var min = newData[0][0].x;
        for (let i = 0; i < newData.length; i++)
        {
            if (newData[i][0].x < min)
            {
                min = newData[i][0].x;
            }
            if (newData[i][newData[i].length-1].x > max)
            {
                max = newData[i][newData[i].length-1].x
            }
        }
        return {min: min, max: max};
    }

    var getOffsetAndWidth = function getOffsetAndWidth(oMin, oMax, min, max)
    {
        let oLength = oMax.valueOf() - oMin.valueOf();
        let length = max.valueOf() - min.valueOf();
        let width = (length/oLength)*(chartWidth-30);

        let leftRatio = min.valueOf() - oMin.valueOf();
        let rightRatio = oMax.valueOf() - min.valueOf();
        let offset = (leftRatio/(leftRatio+rightRatio))*chartWidth;
        console.log("offset",offset);
        return {width: width, offset: offset};
    }

    var translateLines = function()
    {
        ctx.translate(0, count*chartHeight);
        count++;
    }

    var translateNewChart = function translateNewChart(xTranslate)
    {
        ctx.translate(xTranslate, 0);
    }

    var renderText = function renderText() {
        var labelFont = (data.labelFont != null) ? data.labelFont : '20pt Arial';
        ctx.font = labelFont;
        ctx.textAlign = "center";

        //Title
        var txtSize = ctx.measureText(data.title);
        ctx.fillText(data.title, (chartWidth / 2), (margin.top / 2));

        //X-axis text
        txtSize = ctx.measureText(data.xLabel);
        ctx.fillText(data.xLabel, margin.left + (xMax / 2) - (txtSize.width / 2), yMax + (margin.bottom / 1.2));

        //Y-axis text
        ctx.save();
        ctx.rotate(-Math.PI / 2);
        ctx.font = labelFont;
        ctx.fillText(data.yLabel, (yMax / 2) * -1, margin.left / 4);
        ctx.restore();
    }

    var renderLines = function renderLines() {

        //Vertical line
        drawLine(1, 0, 1, chartHeight, 'black');

        //Horizontal Line
        drawLine(0, chartHeight, chartWidth, chartHeight, 'black');
    }

    var renderLabels = function renderLabels() {
        //Vertical guide lines
        var yInc = yMax / newData.length;
        var yPos = 0;
        var yLabelInc = (maxYValue * ratio) / newData.length;
        var xInc = getXInc();
        var xPos = margin.left;

        for (var i = 0; i < newData.length; i++) {
            yPos += (i == 0) ? margin.top : yInc;

            //y axis labels
            ctx.font = (data.dataPointFont != null) ? data.dataPointFont : '10pt Calibri';
            var txt = Math.round(maxYValue - ((i == 0) ? 0 : yPos / ratio));
            var txtSize = ctx.measureText(txt);
            ctx.fillText(txt, margin.left - ((txtSize.width >= 14)?txtSize.width:10) - 7, yPos + 4);

            //x axis labels
            txt = newData[i].x;
            txtSize = ctx.measureText(txt);
            ctx.fillText(txt, xPos, yMax + (margin.bottom / 3));
            xPos += xInc;
        }
    }

    var renderData = function(newData, index, offset, width, max, min) {
        console.log("newData", newData);
        var maxAndMins = getMaxAndMins(newData);
        var xLength = maxAndMins.largestX - maxAndMins.smallestX;
        var yLength = maxAndMins.largestY - maxAndMins.smallestY;
        var a, b, c, d, y;
        var xPos, yPos;
        var txt;
        var fontSize = '8pt Calibri';
        var prevY = 0;
        var prevX = 0;
        var nextY = 0;
        var nextX = 0;
        var first = true;
        var whole = false;
        var prevPos = "";
        var shadedY;
        var shadedHeight = (data.dataPoints[index].normalValues.high - data.dataPoints[index].normalValues.low) / (maxAndMins.largestY) * (chartHeight - 25);

        //Draw rectangle for normal value range
        if (data.dataPoints[index].normalValues.high < maxAndMins.largestY && data.dataPoints[index].normalValues.low > maxAndMins.smallestY)
        {
            y = data.dataPoints[index].normalValues.high - maxAndMins.smallestY;
            shadedY = (chartHeight-30) - (y/yLength)*(chartHeight-30);
            ctx.save();
            ctx.translate(15, 15);
            ctx.fillStyle = 'rgba(100, 100, 100, 0.25)';
            ctx.rect(-15 - offset, shadedY, chartWidth, shadedHeight);
            ctx.fill();
            ctx.restore();
            console.log("Chart 1");
        }
        else if (data.dataPoints[index].normalValues.high > maxAndMins.largestY && data.dataPoints[index].normalValues.low > maxAndMins.smallestY)
        {
            shadedHeight = 15 + (maxAndMins.largestY - data.dataPoints[index].normalValues.low) / (maxAndMins.largestY) * (chartHeight - 25);
            ctx.fillStyle = 'rgba(100, 100, 100, 0.25)';
            ctx.rect(-15 - offset, 0, chartWidth + 15, shadedHeight);
            ctx.fill();
            console.log("Chart 2", y);
        }
        else if (data.dataPoints[index].normalValues.high > maxAndMins.largestY && data.dataPoints[index].normalValues.low < maxAndMins.smallestY)
        {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.25)';
            ctx.rect(-15 - offset, 0, chartWidth + 15, chartHeight);
            ctx.fill();
            console.log("Chart 3");
        }
        else
        {
            y = data.dataPoints[index].normalValues.high - maxAndMins.smallestY;
            shadedY = (chartHeight-30) - (y/yLength)*(chartHeight-30);
            shadedHeight = (chartHeight-15) - shadedY;
            ctx.save();
            ctx.translate(15, 15);
            ctx.fillStyle = 'rgba(100, 100, 100, 0.25)';
            ctx.rect(-15 - offset, shadedY, chartWidth, shadedHeight);
            ctx.fill();
            ctx.restore();
            console.log("Chart 4");
        }

        console.log("Hight and Y", shadedHeight, shadedY);

        if (newData[0].x == min && newData[newData.length-1].x == max)
        {
            whole = true;
            console.log(whole);
        }

        ctx.save();
        //ctx.translate(15, 15);

        if (whole == true) //TODO figure out why they don't line up exactly!!!
        {
            ctx.translate(15, 15);
        }
        else
        {
            ctx.translate(0, 15);
        }

        //Get font for value rendering
        if (data.dataPointFoint)
        {
            fontSize = data.dataPointFoint;
        }
        ctx.font = fontSize;

        for (let i = 0; i < newData.length; i++)
        {
            if (whole == false)
            {
                a = newData[i].x - maxAndMins.smallestX;
                xPos = (a/xLength)*(width /*- 30*/);
                b = newData[i].y - maxAndMins.smallestY;
                yPos = (chartHeight-30) - (b/yLength)*(chartHeight-30);
            }
            else
            {
                a = newData[i].x - maxAndMins.smallestX;
                xPos = (a/xLength)*(width /*- 30*/);
                b = newData[i].y - maxAndMins.smallestY;
                yPos = (chartHeight-30) - (b/yLength)*(chartHeight-30);
            }

            console.log(newData[i].y, xPos, yPos);

            //Render dashed line if necessary
            if (data.dataPoints[index].dashedLines == true)
            {
                if (first == true) {} // do nothing
                else
                {
                    drawDashedLine(prevX, prevY, xPos, yPos);
                }
            }

            if (newData[i].y < data.dataPoints[index].normalValues.low || newData[i].y > data.dataPoints[index].normalValues.high)
            {
                //Render red circle
                ctx.beginPath();
                ctx.fillStyle = 'rgb(255, 0, 0)';
                ctx.arc(xPos, yPos, 2, 0, 2 * Math.PI, false)
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgb(255, 0, 0)';
                ctx.stroke();
                ctx.closePath();
            }
            else
            {
                //Render black circle
                ctx.beginPath();
                ctx.fillStyle = '#000';
                ctx.arc(xPos, yPos, 2, 0, 2 * Math.PI, false)
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#000';
                ctx.stroke();
                ctx.closePath();
            }

            if (i != newData.length - 1)
            {
                c = newData[i+1].x - maxAndMins.smallestX;
                nextX = (c/xLength)*(width-30);
                d = newData[i+1].y - maxAndMins.smallestY;
                nextY = (chartHeight-30) - (d/yLength)*(chartHeight-30);
            }

            //Render value
            if (first == true)
            {
                //if first, compare to next
                if (nextX - xPos < 20 && yPos - nextY <= 20 && yPos - nextY >= 0)
                {
                    prevPos = "bottom";
                    txt = newData[i].y;
                    ctx.textAlign = 'center';
                    ctx.fillText(txt, xPos, yPos + 15);
                    console.log("1.1");
                }
                else
                {
                    prevPos = "top";
                    txt = newData[i].y;
                    ctx.textAlign = 'center';
                    ctx.fillText(txt, xPos, yPos - 5);
                    console.log("1.2");
                }
                first = false;
            }
            else if (i == newData.length - 1)
            {
                //if last, compare to prev
                if (xPos - prevX < 20 && yPos - prevX <= 20 && yPos - nextY >= 0)
                {
                    prevPos = "bottom";
                    txt = newData[i].y;
                    ctx.textAlign = 'center';
                    ctx.fillText(txt, xPos, yPos + 15);
                    console.log("2.1");
                }
                else
                {
                    prevPos = "top";
                    txt = newData[i].y;
                    ctx.textAlign = 'center';
                    ctx.fillText(txt, xPos, yPos - 5);
                    console.log("2.2");
                }
            }
            else
            {
                //if 2nd to n-1, compare to prev and next
                if (xPos - prevX < 20 && prevPos == "top" && yPos - prevY <= 20 && yPos - nextY >= 0)
                {
                    prevPos = "bottom";
                    txt = newData[i].y;
                    ctx.textAlign = 'center';
                    ctx.fillText(txt, xPos, yPos + 15);
                    console.log("3.1");
                }
                else if (nextX - xPos < 20 && prevPos == "top" && yPos - nextY <= 20 && yPos - nextY >= 0)
                {
                    prevPos = "bottom";
                    txt = newData[i].y;
                    ctx.textAlign = 'center';
                    ctx.fillText(txt, xPos, yPos + 15);
                    console.log("3.2");
                }
                else
                {
                    txt = newData[i].y;
                    ctx.textAlign = 'center';
                    ctx.fillText(txt, xPos, yPos - 5);
                    console.log("3.3");
                }
            }

            console.log("prevX", prevX, "xPos", xPos, "prevY", prevY, "yPos", yPos, "nextX", nextX, "nextY", nextY);

            prevX = xPos;
            prevY = yPos;
        }

        ctx.restore();

    };

    var drawLine = function drawLine(startX, startY, endX, endY, strokeStyle, lineWidth) {
        if (strokeStyle != null) ctx.strokeStyle = strokeStyle;
        if (lineWidth != null) ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.closePath();
    }

    var drawDashedLine = function drawDashedLine(startX, startY, endX, endY)
    {
        ctx.strokeStyle = 'rgba(0, 0, 0, .5)';
        ctx.beginPath();
        ctx.setLineDash([10, 10]);
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    var getMaxAndMins = function (newData) {
        if (newData.length % 2 == 0)
        {
            //set initial largest and smallest x values
            if(newData[0].x >= newData[1].x)
            {
                var largestX = newData[0].x;
                var smallestX = newData[1].x;
            }
            else
            {
                var largestX = newData[1].x;
                var smallestX = newData[0].x;
            }

            //set initial largest and smallest y values
            if(newData[0].y >= newData[1].y)
            {
                var largestY = newData[0].y;
                var smallestY = newData[1].y;
            }
            else
            {
                var largestY = newData[1].y;
                var smallestY = newData[0].y;
            }
            var i = 2;
            var j = 3;
        }
        else
        {
            var largestX = newData[0].x;
            var smallestX = newData[0].x;
            var largestY = newData[0].y;
            var smallestY = newData[0].y;
            var i = 1;
            var j = 2;
        }

        //find smallest and largest x and y values in the data set
        while (j <= newData.length)
        {
            //x
            if (newData[i].x >= newData[j].x)
            {
                if (newData[i].x > largestX)
                {
                    largestX = newData[i].x;
                }
                if (newData[j].x < smallestX)
                {
                    smallestX = newData[j].x;
                }
            }
            else
            {
                if (newData[i].x < smallestX)
                {
                    smallestX = newData[i].x;
                }
                if (newData[j].x > largestX)
                {
                    largestX = newData[j].x;
                }
            }

            //y
            if (newData[i].y >= newData[j].y)
            {
                if (newData[i].y > largestY)
                {
                    largestY = newData[i].y;
                }
                if (newData[j].y < smallestY)
                {
                    smallestY = newData[j].y;
                }
            }
            else
            {
                if (newData[i].y < smallestY)
                {
                    smallestY = newData[i].y;
                }
                if (newData[j].y > largestY)
                {
                    largestY = newData[j].y;
                }
            }
            i+=2;
            j+=2;
        }

        console.log(smallestX, smallestY, largestX, largestY);
        return {smallestX: smallestX, smallestY: smallestY, largestX: largestX, largestY: largestY};
    };

    return {
        renderType: renderType,
        render: render
    };
}();
