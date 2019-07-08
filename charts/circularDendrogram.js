(function() {
    console.log("inside circular dendrogram function");
    // TREE MODEL DEFINITION

    var tree = raw.model();

    var hierarchy = tree.dimension('hierarchy')
        .title('Hierarchy')
        .description("This is a description of the hierarchy that illustrates what the dimension is for and other things.")
        .required(1)
        .multiple(true);

    var size = tree.dimension('size')
        .title('Size')
        .description("This is a description of the hierarchy that illustrates what the dimension is for and other things.")
        .accessor(function(d) { return +d; })
        .types(Number)

    var color = tree.dimension('color')
        .title('Color')

    var label = tree.dimension('label')
        .title('Label')
        .multiple(true);

    // accessor forces a cast to number
    const someDimension = tree.dimension().title("Some dimension").accessor(d => +d).types(Number);


    tree.map(data => {
        var root = { children : [] };
        data.forEach(function(d) {
            if (!hierarchy()) return root;

            console.log("object is %o", d);

            // Seek destructively modifies root
            var leaf = seek(root, hierarchy(d), hierarchy(), d);

            if(leaf === false || !leaf) return;

            if (!leaf.size) leaf.size = 0;
            leaf.size += size() ? +size(d) : 1;

            //console.log(leaf, color(), color(d))
            leaf.color = color(d);
            leaf.label = label(d);

            delete leaf.children;
        });

        return root;
    });

    // The full record is present and needs to be passed through the recursion.
    function seek(root, path, classes, record) {
        if (path.length < 1) return false;
        if (!root.children) root.children = [];
        var p = root.children.filter(function(d) { return d.name == path[0]; })[0];

        if (!p) {
            if( /\S/.test(path[0]) ) {
                // Nodes are constructed here.
                p = { 
                    name: path[0],
                    class: classes[0],
                    children:[],
                    someDimension: someDimension(record)
                };
                root.children.push(p);
            } else p = root;
        }
        if (path.length == 1) return p;
        else return seek(p, path.slice(1), classes.slice(1), record);
    }

    tree.dimensions().remove('size');
    tree.dimensions().remove('color');
    tree.dimensions().remove('label');

    var chart = raw.chart()
	.title('Circular Dendrogram')
	.description(
	    "Dendrograms are tree-like diagrams used to represent the distribution of a hierarchical clustering. The different depth levels represented by each node are visualized on the horizontal axes and it is useful to visualize a non-weighted hierarchy.<br />Based on <br /><a href='http://bl.ocks.org/mbostock/4063570'>http://bl.ocks.org/mbostock/4063570</a>")
	.thumbnail("imgs/circularDendrogram.png")
	.category('Hierarchy')
	.model(tree);

    var diameter = chart.number()
	.title("Radius")
	.defaultValue(1000)
	.fitToWidth(true);

    function linkDiagonal(d) {
	return "M" + project(d.x, d.y) +
	    "C" + project(d.x, (d.y + d.parent.y) / 2) +
	    " " + project(d.parent.x, (d.y + d.parent.y) / 2) +
	    " " + project(d.parent.x, d.parent.y);
    }

    function project(x, y) {
	var angle = (x - 90) / 180 * Math.PI,
	    radius = y;
	return [radius * Math.cos(angle), radius * Math.sin(angle)];
    }

    // draw should be more accurately named, registerDrawFunction()
    chart.draw((selection, data) => {
        console.log("called at draw time");
        console.log("data is %o", data);
	var g = selection
	    .attr("width", +diameter())
	    .attr("height", +diameter())
	    .append("g")
	    .attr("transform", `translate(${diameter()/2}, ${diameter()/2})`);

	var cluster = d3.cluster()
	    .size([360, diameter() / 2 - 120]);

	root = d3.hierarchy(data);
	cluster(root);

	var link = g.selectAll("path.link")
	    .data(root.descendants().slice(1))
	    .enter().append("path")
	    .attr("class", "link")
	    .style("fill", "none")
	    .style("stroke", "#cccccc")
	    .style("stroke-width", "1px")
	    .attr("d", linkDiagonal);

	var node = g.selectAll("g.node")
	    .data(root.descendants())
	    .enter().append("g")
	    .attr("class", "node")
	    .attr("transform", d => {
		return `rotate(${d.x - 90})translate(${d.y})`;
	    });

	node.append("circle")
	    .attr("r", 4.5)
	    .style("fill", "#eeeeee")
	    .style("stroke", "#999999")
	    .style("stroke-width", "1px");

	node.append("text")
	    .attr("dy", ".31em")
	    .attr("text-anchor", d => {
		return d.x < 180 ? "start" : "end";
	    })
	    .attr("transform", d => {
		return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)";
	    })
	    .text(d => {
		return d.data.name;
	    })
	    .style("font-size", "11px")
	    .style("font-family", "Arial, Helvetica");

    })
})();
