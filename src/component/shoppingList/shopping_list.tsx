import React from "react";

const shopping_list = (props: any) => {
  return (
    <div className="shopping-list">
      <h1>Shopping List for {props.name}</h1>
      <ul>
        <li>Instagram</li>
        <li>WhatsApp</li>
        <li>Oculus</li>
      </ul>
    </div>
  );
};

export default shopping_list;
// Example usage: <ShoppingList name="Mark" />
