import { doc, getDoc } from "firebase/firestore";
import { GetServerSidePropsContext } from "next"
import { Community, communityState } from "../../../atoms/communitiesAtom";
import { firestore } from "../../../firebase/clientApp";
import safeJsonStringify from 'safe-json-stringify'
import NotFound from "../../../components/Community/NotFound";
import Header from "../../../components/Community/Header";
import PageContent from "../../../components/Layout/PageContent";
import CreatePostLink from "../../../components/Community/CreatePostLink";
import Posts from "../../../components/Posts/Posts";
import { useRecoilState, useSetRecoilState } from "recoil";
import { useEffect } from "react";
import About from "../../../components/Community/About";


type CommunityPageProps = {
    communityData: Community
};

const CommunityPage:React.FC<CommunityPageProps> = ({communityData}) => {
    

    // console.log("community data : " , communityData)
    const setCommunityStateValue = useSetRecoilState(communityState)

    useEffect(() => {
      setCommunityStateValue(prev => ({
        ...prev,
        currentCommunity: communityData
      }))
    } , [communityData])

    if(!communityData){
        return <NotFound/>
    }    

    

    return (
      <div>
        <>
          <Header communityData={communityData} />
          <PageContent>
            <>
              <CreatePostLink/>
              <Posts communityData={communityData}/>
            </>
            <>
              <About communityData={communityData}/>
            </>
          </PageContent>
        </>
      </div>
    );
}


export async function getServerSideProps(context:GetServerSidePropsContext){
    // get community data and pass on to client component 

    try {
        const communityDocRef = doc(
          firestore,
          "communities",
          context.query.communityId as string
        );
        const communityDoc = await getDoc(communityDocRef)

        return {
          props: {
            communityData: communityDoc.exists() ?  JSON.parse(
              safeJsonStringify({ id: communityDoc.id, ...communityDoc.data() })
            ) : "",
          },
        };
    }
    catch (error) {
        // We can have an error page over here .
        console.log('getServerSideProps error' , error)
    }
}

export default CommunityPage;