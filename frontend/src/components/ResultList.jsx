import React, { Component } from "react";
import ResultListItem from "./ResultListItem.jsx";
import { Grid } from "semantic-ui-react";

import "./ResultList.css";

const numOfColsPerRow = 5;

class ResultList extends Component {
    render() {
        const self = this;
        const { props } = self;
        const { entries } = props;
        const numOfEmptyColumns = numOfColsPerRow - 1;

        const listItems = entries.concat(new Array(numOfEmptyColumns).fill(null)).map((entry) => {
            let htmlEntry = "";
            if (entry) {
                htmlEntry = <ResultListItem entry={entry} key={entry.id} />;
            }
            return htmlEntry;
        });

        return (
            <Grid centered className="ResultList-grid">
                {listItems.map((item, i) => {
                    return (
                        <Grid.Column
                            mobile={16}
                            widescreen={3}
                            computer={5}
                            largeScreen={3}
                            tablet={8}
                            key={i}
                        >
                            {item}
                        </Grid.Column>
                    );
                })}
            </Grid>
        );
    }
}

export default ResultList;
