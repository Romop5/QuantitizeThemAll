function generateExpressionFromGrammar(rules, minIters, maxIters, oscillation, startingExpression)
{
    if(startingExpression == undefined)
        startingExpression = [ "E" ]
    // Clamp miniters to maxiters at most
    minIters = (minIters > maxIters)?maxIters:minIters;
    var i = 0;
    var current = startingExpression;
    var maxAttempts = 200;
    // while generation terminates before mininum iterations
    while(i < minIters && maxAttempts > 0)
    {
        var current = startingExpression
        var shouldTerminate = false;
        // try new generation
        for(i = 0; i < maxIters && !shouldTerminate; i++)
        {
            shouldTerminate = true;
            var next = []
            for(var j = 0; j < current.length; j++)
            {
                const element = current[j];
                if(!rules.hasOwnProperty(element))
                {
                   next.push(element);
                   continue;
                }
                shouldTerminate = false;
                var alternatives = rules[element];
                const randomRule= alternatives[Math.floor(Math.random() * alternatives.length)];
                console.log("Rule:" , randomRule);
                next = next.concat(randomRule);
                console.log("After concat:" , next);
            }
            current = next;
        }
        maxAttempts = maxAttempts-1;
    }

    current.forEach(function (part,index)
        {
            if(part == "E")
                current[index] = "x";
            if(part == "C")
                current[index] = (Math.random()*oscillation).toFixed(2).toString();
        }
    );
    return toStringExpression(current);

}

function generateExpression(minIters, maxIters)
{
    var rules =
    {
        "E": [ ["(","E","+","E",")"],["(","E","*","E", ")"],["sin(","E", ")"],
                        ["cos(","E", ")"],["mod(","E",",","C",")"], ["x"], [ "y"], ["C"]]
    }
    return generateExpressionFromGrammar(rules, minIters, maxIters,30);
}

function createGrammarFromConfig(config)
{
    var alternatives = []
    if(config.hasOwnProperty("binary"))
    {
        var binaryFunc = config.binary;
        for(var i = 0; i < binaryFunc.length; i++)
        {
            var funcName = binaryFunc[i];
            switch(funcName)
            {
                case "mod":
                    alternatives.push([funcName,"(","E",",","C",")"]);
                    break;
                default:
                    alternatives.push([funcName,"(","E",",","E",")"]);
                    break;
            }
        }
    }

    if(config.hasOwnProperty("unary"))
    {
        var unaryFunc = config.unary;
        for(var i = 0; i < unaryFunc.length; i++)
            alternatives.push([unaryFunc[i],"(","E",")"]);
    }

    if(config.hasOwnProperty("constants") && config.constants)
    {
        alternatives.push(["C"])
    }

    // Always push inputs
    alternatives.push(["x"])
    alternatives.push(["y"])
    // Allow time
    if(config.allow_time)
        alternatives.push(["t"])

    // Always add *+ to form binary function
    alternatives.push(["E","+","E"])
    alternatives.push(["E","*","E"])
    return {"E": alternatives}
}

function toStringExpression(expr)
{
   var result = "";
   expr.forEach(element => result += element );
   return result;
}
