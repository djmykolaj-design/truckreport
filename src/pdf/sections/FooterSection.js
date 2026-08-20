export function FooterSection() {
    return [
        {
            margin: [0, 35, 0, 0],

            canvas: [
                {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 515,
                    y2: 0,
                    lineWidth: 1,
                    lineColor: "#D1D5DB",
                },
            ],
        },

        {
            columns: [

                {
                    text: "TruckReport v1.0",
                    fontSize: 9,
                    color: "#666",
                },

                {
                    text:
                        "Згенеровано\n" +
                        new Date().toLocaleString("uk-UA"),

                    alignment: "center",

                    fontSize: 9,

                    color: "#666",
                },

                {
                    text: "© TruckReport",

                    alignment: "right",

                    fontSize: 9,

                    color: "#666",
                },

            ],

            margin: [0, 10, 0, 0],
        },
    ];
}