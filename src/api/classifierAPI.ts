import { APIURL as config } from "../apiConfig";

export async function get_classifier(
  ) {
    const response = await fetch(
      `${config.get_classifiers}`,
      { method: "GET" }
    );
    if (response.ok) {
      const data = await response.json();
      return { data };
    } else {
      throw new Error(`Error creating plot for sensor: ${response.status}`);
    }
  }

  export async function update_classifier(ClassifierName: string, AlgorithmName: string, ActivationFlag: boolean) {
    const url = `${config.update_classifiers}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({"classifier_name":ClassifierName, "algorithm_name":AlgorithmName, "activation_flag": ActivationFlag}),
    
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data)
      return {data};
    }
    if (!response.ok) {
      throw new Error(`Failed to connect sensor: ${response.status}`);
    }
  
  }

  export async function request_classifier_result(
    classifier_name: string,
  
  ) {
    const response = await fetch(
      `${config.get_classifier_result}${classifier_name}`,
      { method: "GET" }
    );
    if (response.ok) {
      const data = await response.json();
      return { data };
    } else {
      throw new Error(`Failed to get the classifier result: ${response.status}`);
    }
  }

  