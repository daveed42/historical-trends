var CanvasChart = function () {
    var ctx;
    var margin = { top: 0, left: 0, right: 0, bottom: 0 };
    var chartHeight, chartWidth, yMax, xMax, data;
    var maxYValue = 0;
    var ratio = 0;
    var renderType = { bars: 'bars', points: 'points' };

    var render = function(canvasId, dataObj) {
        data = dataObj;
        newData = data.dataPoints.map(makeDate);
        newData = sortData(newData);
        getMaxDataYValue();
        var canvas = document.getElementById(canvasId);
        chartHeight = canvas.getAttribute('height');
        chartWidth = canvas.getAttribute('width');
        xMax = chartWidth - (margin.left + margin.right);
        yMax = chartHeight - (margin.top + margin.bottom);
        ratio = yMax / maxYValue;
        ctx = canvas.getContext("2d");
        //ctx.translate(5,0); maybe do this??
        renderChart();
        doStuff();
    }

    var makeDate = function (data) {
        data.x = new Date(data.x);
        return data;
    }

    //insertion sort
    var sortData = function (data) {
        for (let i = 0; i < data.length; i++)
        {
            let temp = data[i];
            let j = i - 1;
            while (j >= 0 && data[j].x > temp.x)
            {
                data[j + 1] = data[j];
                j--;
            }
            data[j + 1] = temp;
        }
        return data;
    }

    var renderChart = function () {
        renderLines();

        //render data based upon type of renderType(s) that client supplies
        if (data.renderTypes == undefined || data.renderTypes == null) data.renderTypes = [renderType.points];
        for (var i = 0; i < data.renderTypes.length; i++) {
            renderData(data.renderTypes[i]);
        }
    }

    var getMaxDataYValue = function () {
        for (var i = 0; i < newData.length; i++) {
            if (newData[i].y > maxYValue) maxYValue = newData[i].y;
        }
    };

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
        drawLine(margin.left, margin.top, margin.left, yMax, 'black');

        //Horizontal Line
        drawLine(margin.left, yMax, xMax+10, yMax, 'black');
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

    var renderData = function(type) {
        var maxAndMins = getMaxAndMins();
        var xLength = maxAndMins.largestX - maxAndMins.smallestX;
        var yLength = maxAndMins.largestY - maxAndMins.smallestY;
        var a, b, c, d, y;
        var xPos, yPos;
        var txt, txtSize;
        var prevY = 0;
        var prevX = 0;
        var nextY = 0;
        var nextX = 0;
        var first = true;
        var prevPos = "";
        var shadedY;
        var shadedHeight = (data.normalValues.high - data.normalValues.low) / (maxAndMins.largestY) * (chartHeight - 25);

        //Draw rectangle for normal value range
        if (data.normalValues.high < maxAndMins.largestY && data.normalValues.low > maxAndMins.smallestY)
        {
            y = data.normalValues.high - maxAndMins.smallestY;
            shadedY = (chartHeight-30) - (y/yLength)*(chartHeight-30);
            ctx.save();
            ctx.translate(15, 15);
            ctx.fillStyle = 'rgba(100, 100, 100, 0.25)';
            ctx.rect(-15, shadedY, chartWidth, shadedHeight);
            ctx.fill();
            ctx.restore();
            console.log("Chart 1");
        }
        else if (data.normalValues.high > maxAndMins.largestY && data.normalValues.low > maxAndMins.smallestY)
        {
            y = maxAndMins.largestY;
            ctx.fillStyle = 'rgba(100, 100, 100, 0.25)';
            ctx.rect(-15, 0, chartWidth, shadedHeight);
            ctx.fill();
            console.log("Chart 2");
        }
        else if (data.normalValues.high > maxAndMins.largestY && data.normalValues.low < maxAndMins.smallestY)
        {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.25)';
            ctx.rect(-15, 0, chartWidth, chartHeight);
            ctx.fill();
            console.log("Chart 3");
        }
        else
        {
            y = data.normalValues.high - maxAndMins.smallestY;
            shadedY = (chartHeight-30) - (y/yLength)*(chartHeight-30);
            //shadedHeight =
            ctx.save();
            ctx.translate(15, 15);
            ctx.fillStyle = 'rgba(100, 100, 100, 0.25)';
            ctx.rect(-15, shadedY, chartWidth, shadedHeight);
            ctx.fill();
            ctx.restore();
            console.log("Chart 4");
        }

        console.log("Hight and Y", shadedHeight, shadedY);

        ctx.save();
        ctx.translate(15, 15);

        for (var i = 0; i < newData.length; i++)
        {
            a = newData[i].x - maxAndMins.smallestX;
            xPos = (a/xLength)*(chartWidth-30);
            b = newData[i].y - maxAndMins.smallestY;
            yPos = (chartHeight-30) - (b/yLength)*(chartHeight-30);
            console.log(newData[i].y, xPos, yPos);

            if (newData[i].y < data.normalValues.low || newData[i].y > data.normalValues.high)
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
                nextX = (c/xLength)*(chartWidth-30);
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
                    txtSize = ctx.measureText(txt);
                    ctx.textAlign = 'center';
                    ctx.fillText(txt, xPos, yPos + 15);
                    console.log("1.1");
                }
                else
                {
                    prevPos = "top";
                    txt = newData[i].y;
                    txtSize = ctx.measureText(txt);
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
                    txtSize = ctx.measureText(txt);
                    ctx.textAlign = 'center';
                    ctx.fillText(txt, xPos, yPos + 15);
                    console.log("2.1");
                }
                else
                {
                    prevPos = "top";
                    txt = newData[i].y;
                    txtSize = ctx.measureText(txt);
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
                    txtSize = ctx.measureText(txt);
                    ctx.textAlign = 'center';
                    ctx.fillText(txt, xPos, yPos + 15);
                    console.log("3.1");
                }
                else if (nextX - xPos < 20 && prevPos == "top" && yPos - nextY <= 20 && yPos - nextY >= 0)
                {
                    prevPos = "bottom";
                    txt = newData[i].y;
                    txtSize = ctx.measureText(txt);
                    ctx.textAlign = 'center';
                    ctx.fillText(txt, xPos, yPos + 15);
                    console.log("3.2");
                }
                else
                {
                    txt = newData[i].y;
                    txtSize = ctx.measureText(txt);
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

    var getMaxAndMins = function () {
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
