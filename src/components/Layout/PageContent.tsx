import { Flex } from "@chakra-ui/react";
import { ReactNode } from "react";

type PageContentProps = {
    children: ReactNode[]
};

const PageContent:React.FC<PageContentProps> = ({children}) => {
    
    return (
      <Flex justify="center" padding="16px 0px" >
        <Flex
          width="95%"
          justify="center"
          maxWidth="860px"
          // border="1px solid green"
        >
          {/* LHS */}
          <Flex
            direction="column"
            width={{ base: "100%", md: "65%" }}
            // border="1px solid blue"
            mr={{ base: 0, md: 6 }}
          >
            {children && children[0]}
          </Flex>
          {/* RHS */}
          <Flex
            direction="column"
            display={{ base: "none", md: "flex" }}
            // border="1px solid orange"
            flexGrow={1}
          >
            {children && children[1]}
          </Flex>
        </Flex>
      </Flex>
    );
}
export default PageContent;