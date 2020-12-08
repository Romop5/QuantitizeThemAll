function generateExpression(maxIters)
{
    var rules = 
    {
        "E": [ ["(","E","+","E",")"],["(","E","*","E", ")"],["sin(","E", ")"],
                        ["cos(","E", ")"],["mod(","E",",","C",")"], ["x"], [ "y"], ["C"]]
    }

    /*
        E -> sin ( E ) | x | y
    */
    var current = [ "E" ];
    for(var i = 0; i < maxIters; i++)
    {
        var next = []
        for(var j = 0; j < current.length; j++)
        {
            const element = current[j];
            if(!rules.hasOwnProperty(element))
            {
               next.push(element);
               continue;
            }
            var alternatives = rules[element];
            const randomRule= alternatives[Math.floor(Math.random() * alternatives.length)];
            console.log("Rule:" , randomRule);
            next = next.concat(randomRule);
            console.log("After concat:" , next);
        }
        current = next;
    }

    current.forEach(function (part,index)
        {
            if(part == "E")
                current[index] = "x";
            if(part == "C")
                current[index] = (Math.random()*30.0).toFixed(2).toString();
        }
    );
    return toStringExpression(current);
}

function toStringExpression(expr)
{
   var result = "";
   expr.forEach(element => result += element );
   return result;
}
