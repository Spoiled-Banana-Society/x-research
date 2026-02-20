// 0x2FbD6fA44C51A5Af5a557fE9bA32e4763DD8A7bD
// 2755

package main

import (
	"fmt"
	"github.com/Spoiled-Banana-Society/sbs-drafts-api/utils"
)

func main() {
	err := utils.CreateEthConnection("0x6b417828051328caef5b4e0bfe8325962ec8fb17", "https://mainnet.infura.io/v3/0d15d12afb094dbe97df37f8b62d6c96")
	if err != nil {
		fmt.Println("ERROR creating eth connection: ", err)
		panic(err)
	}
	contractOwner, _ := utils.Contract.GetOwnerOfToken(int(2755))

	fmt.Println(contractOwner)
}