var examples = [
	  { name: "Granny Knot", 
	    begin: 0,
		end: 1,
		step: 0.01,
		fX : "-0.22 * cos(2*pi*t) - 1.28 * sin(2*pi*t) - 0.44 * cos(3 * 2*pi*t) - 0.78 * sin(3 * 2*pi*t)",
		fY : "-0.1 * cos(2 * 2*pi*t) - 0.27 * sin(2 * 2*pi*t) + 0.38 * cos(4 * 2*pi*t) + 0.46 * sin(4 * 2*pi*t)",
		fZ : "0.7 * cos(3 * 2*pi*t) - 0.4 * sin(3 * 2*pi*t)"},
     { name: "Heart Curve", 
	    begin: 0,
		end: 1,
		step: 0.01,
		fX : "16 * pow(sin(2*pi*t), 3)",
		fY : "13 * cos(2*pi*t) - 5 * cos(2 * 2*pi*t) - 2 * cos(3 * 2*pi*t) - cos(4 * 2*pi*t)",
		fZ : "0.7 * cos(3 * 2*pi*t) - 0.4 * sin(3 * 2*pi*t)"},
    { name: "Viviani's Curve", 
	    begin: 0,
		end: 1,
		step: 0.01,
		fX : "5 * (1 + cos(4*pi*t))",
		fY : "5 * sin(4*pi*t)",
		fZ : "2 * 5 * sin(4*pi*t / 2)"},
    { name: "Knot Curve", 
	    begin: 0,
		end: 1,
		step: 0.01,
		fX : "2 * sin(2*pi*t)",
		fY : "cos(2*pi*t) * (1 + 2 * cos(2*pi*t))",
		fZ : "sin(2*pi*t) * (1 + 2  * cos(2*pi*t))"},
	  { name : "Helix", 
	    begin: -1,
		end: 1,
		step: 0.01,
		fX : "cos(2*pi*t * 4)",
		fY : "sin(2*pi*t * 4)",
		fZ : "4*t"},
    { name: "Trefoil Knot", 
	    begin: 0,
		end: 1,
		step: 0.01,
		fX : "(2 + cos(3 * 2*pi*t)) * cos(2 * 2*pi*t)",
		fY : "(2 + cos(3 * 2*pi*t)) * sin(2 * 2*pi*t)",
		fZ : "sin(3 * 2*pi*t)"},
		
    { name: "Torus Knot", 
	    begin: 0,
		end: 1,
		step: 0.01,
		fX : "(2 + cos(3 * 2*pi*t)) * cos(2 * 2*pi*t)",
		fY : "(2 + cos(3 * 2*pi*t)) * sin(2 * 2*pi*t)",
		fZ : "sin(3 * 2*pi*t)"},
	
    { name: "Cinquefoil Knot", 
	    begin: 0,
		end: 1,
		step: 0.01,
		fX : "(2 + cos(5 * 2*pi*t)) * cos(2 * 2*pi*t)",
		fY : "(2 + cos(5 * 2*pi*t)) * sin(2 * 2*pi*t)",
		fZ : "sin(5 * 2*pi*t)"},
		
    { name: "Decorated Torus Knot 4a", 
	    begin: 0,
		end: 1,
		step: 0.01,
		fX : "cos(2 * 2*pi*t) * (1 + 0.6 * (cos(5 * 2*pi*t) + 0.75 * cos(10 * 2*pi*t)))",
		fY : "sin(2 * 2*pi*t) * (1 + 0.6 * (cos(5 * 2*pi*t) + 0.75 * cos(10 * 2*pi*t)))",
		fZ : "0.35 * sin(5 * 2*pi*t)"},
		
    { name: "Decorated Torus Knot 4b", 
	    begin: 0,
		end: 1,
		step: 0.01,
		fX : "cos(2 * 2*pi*t) * (1 + 0.45 * cos(3 * 2*pi*t) + 0.4 * cos(9 * 2*pi*t))",
		fY : "sin(2 * 2*pi*t) * (1 + 0.45 * cos(3 * 2*pi*t) + 0.4 * cos(9 * 2*pi*t))",
		fZ : "0.2 * sin(9 * 2*pi*t)"},
		
    { name: "Decorated Torus Knot 5a", 
	    begin: 0,
		end: 1,
		step: 0.01,
		fX : "cos(3 * 2*pi*t) * (1 + 0.3 * cos(5 * 2*pi*t) + 0.5 * cos(10 * 2*pi*t))",
		fY : "sin(3 * 2*pi*t) * (1 + 0.3 * cos(5 * 2*pi*t) + 0.5 * cos(10 * 2*pi*t))",
		fZ : "0.2 * sin(20 * 2*pi*t)"},
		
    { name: "Decorated Torus Knot 5c", 
	    begin: 0,
		end: 1,
		step: 0.01,
		fX : "cos(4 * 2*pi*t) * (1 + 0.5 * (cos(5 * 2*pi*t) + 0.4 * cos(20 * 2*pi*t)))",
		fY : "sin(4 * 2*pi*t) * (1 + 0.5 * (cos(5 * 2*pi*t) + 0.4 * cos(20 * 2*pi*t)))",
		fZ : "0.35 * sin(15 * 2*pi*t)"},
];