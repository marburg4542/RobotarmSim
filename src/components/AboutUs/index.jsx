import { useEffect } from 'react';
import moImg from '../../assets/mo.jpg';
import peeImg from '../../assets/pee.jpg';
import jdaiImg from '../../assets/jdai.jpg';

export default function AboutUs() {
  useEffect(() => {
    document.title = 'About Us - Robotic Arm Control';
  }, []);

  const teamMembers = [
    {
      name: 'Tharathep Khamchan',
      role: 'Algorithm & System engineering',
      bio: 'B6521301',
      img: moImg
    },
    {
      name: 'Peeravit Buithaweesap',
      role: 'Frontend and Control systems',
      bio: 'B6514235',
      img: peeImg
    },
    {
      name: 'Wasin Phuangkaew',
      role: 'Mechanical design and Electronics',
      bio: 'B6524746',
      img: jdaiImg
    }
  ];

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-6xl mx-auto">
        <section className="text-center py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
            About Our Project
          </h1>
          <p className="text-xl max-w-2xl mx-auto">
            Innovative robotic arm control system with 6 degrees of freedom
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-center border-b-2 pb-2">
            Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="card bg-base-200 shadow-xl">
                <figure>
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-full h-64 object-cover"
                  />
                </figure>
                <div className="card-body">
                  <h3 className="card-title">{member.name}</h3>
                  <p className="font-semibold text-secondary">{member.role}</p>
                  <p>{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
